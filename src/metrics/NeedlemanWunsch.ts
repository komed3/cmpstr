/**
 * Needleman-Wunsch Algorithm
 * src/metrics/NeedlemanWunsch.ts
 * 
 * @see https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
 * 
 * The Needleman-Wunsch algorithm performs global alignment, aligning two strings
 * entirely, including gaps. It is commonly used in bioinformatics for sequence
 * alignment.
 * 
 * This implementation is highly optimized for both time and memory efficiency.
 * It uses only two rows of the dynamic programming matrix at any time, and always
 * iterates over the shorter string for memory efficiency (a is always the shorter
 * string in (a, b)). Batch processing is supported via the Metric base class.
 * 
 * @module Metric/NeedlemanWunsch
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

/**
 * NeedlemanWunschDistance class extends the Metric class to implement the Needleman-Wunsch algorithm.
 */
export default class NeedlemanWunschDistance extends Metric {

    /**
     * Constructor for the NeedlemanWunsch class.
     * 
     * Initializes the Needleman-Wunsch metric with two input strings or
     * arrays of strings and optional options.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     */
    constructor (
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        // Call the parent Metric constructor with the metric name and inputs
        // Metric is symmetrical
        super( 'needlemanWunsch', a, b, options, true );

    }

    /**
     * Calculates the Needleman-Wunsch global alignment score between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute} - Object containing the similarity result and raw score
     */
    override compute ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute {

        // Scoring parameters (can be customized via options if needed)
        const { match = 1, mismatch = -1, gap = -1 } = this.options;

        // Get two reusable arrays from the Pool for the DP rows
        const [ prev, curr ] = Pool.acquireMany( 'uint16', [ m + 1, m + 1 ] );

        // Initialize the first row (gap penalties)
        prev[ 0 ] = 0; for ( let i = 1; i <= m; i++ ) prev[ i ] = prev[ i - 1 ] + gap;

        // Fill the DP matrix row by row
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

        // Use the maximum possible score for the longer string (global alignment)
        const total = maxLen * match;

        // Return the result as a MetricCompute object
        return {
            res: total === 0 ? 0 : score / total,
            raw: { score, total }
        };

    }

}