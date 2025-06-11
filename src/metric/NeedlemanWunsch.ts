/**
 * Needleman-Wunsch Algorithm
 * src/metric/NeedlemanWunsch.ts
 * 
 * @see https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
 * 
 * The Needleman-Wunsch algorithm performs global alignment, aligning two strings
 * entirely, including gaps. It is commonly used in bioinformatics for sequence
 * alignment.
 * 
 * @module Metric/NeedlemanWunsch
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric, MetricRegistry } from './Metric';
import { Pool } from '../utils/Pool';

export interface NeedlemanRaw {
    score: number;
    denum: number;
};

/**
 * NeedlemanWunschDistance class extends the Metric class to implement the Needleman-Wunsch algorithm.
 */
export class NeedlemanWunschDistance extends Metric<NeedlemanRaw> {

    /**
     * Constructor for the NeedlemanWunsch class.
     * 
     * Initializes the Needleman-Wunsch metric with two input strings or
     * arrays of strings and optional options.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} [opt] - Options for the metric computation
     */
    constructor ( a: MetricInput, b: MetricInput, opt: MetricOptions = {} ) {

        // Call the parent Metric constructor with the metric name and inputs
        // Metric is symmetrical
        super ( 'needlemanWunsch', a, b, opt, true );

    }

    /**
     * Calculates the Needleman-Wunsch global alignment score between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute<NeedlemanRaw>} - Object containing the similarity result and raw score
     */
    protected override compute (
        a: string, b: string, m: number, n: number,
        maxLen: number
    ) : MetricCompute<NeedlemanRaw> {

        // Scoring parameters (can be customized via options if needed)
        const { match = 1, mismatch = -1, gap = -1 } = this.options;

        // Get two reusable arrays from the Pool for the DP rows
        const len: number = m + 1;
        const [ prev, curr ] = Pool.acquireMany( 'uint16', [ len, len ] );

        // Initialize the first row (gap penalties)
        prev[ 0 ] = 0; for ( let i = 1; i <= m; i++ ) prev[ i ] = prev[ i - 1 ] + gap;

        // Fill the DP matrix row by row (over the longer string)
        for ( let j = 1; j <= n; j++ ) {

            curr[ 0 ] = prev[ 0 ] + gap;

            // Get the character code of the current character in b
            const cb: number = b.charCodeAt( j - 1 );

            for ( let i = 1; i <= m; i++ ) {

                // Score for match / mismatch
                const score: number = a.charCodeAt( i - 1 ) === cb ? match : mismatch;

                // Calculate the maximum score for current cell
                curr[ i ] = Math.max(
                    prev[ i - 1 ] + score,   // Diagonal (match/mismatch)
                    prev[ i ] + gap,         // Up (gap)
                    curr[ i - 1 ] + gap      // Left (gap)
                );

            }

            // Copy current row to previous for next iteration
            prev.set( curr );

        }

        // The last value in prev is the Needleman-Wunsch score
        const score: number = prev[ m ];

        // Release arrays back to the pool
        Pool.release( 'uint16', prev, len );
        Pool.release( 'uint16', curr, len );

        // Use the maximum possible score for the longer string (global alignment)
        const denum: number = maxLen * match;

        // Return the result as a MetricCompute object
        return {
            res: denum === 0 ? 0 : Metric.clamp( score / denum ),
            raw: { score, denum }
        };

    }

}

// Register the Needleman-Wunsch algorithm in the metric registry
MetricRegistry.add( 'needlemanWunsch', NeedlemanWunschDistance );