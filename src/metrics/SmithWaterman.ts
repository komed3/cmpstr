/**
 * Smith-Waterman Algorithm
 * src/metrics/SmithWaterman.ts
 * 
 * @see https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm
 * 
 * The Smith-Waterman algorithm performs local alignment, finding the best matching
 * subsequence between two strings. It is commonly used in bioinformatics for local
 * sequence alignment. Instead of looking at the entire sequence, the Smith–Waterman
 * algorithm compares segments of all possible lengths and optimizes the similarity
 * measure.
 * 
 * @module Metric/SmithWatermanDistance
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

export interface SmithWatermanRaw {
    score: number;
    denum: number;
};

/**
 * SmithWatermanDistance class extends the Metric class to implement the Smith-Waterman algorithm.
 */
export default class SmithWatermanDistance extends Metric<SmithWatermanRaw> {

    /**
     * Constructor for the SmithWaterman class.
     * 
     * Initializes the Smith-Waterman metric with two input strings or
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
        super( 'smithWaterman', a, b, options, true );

    }

    /**
     * Calculates the Smith-Waterman local alignment score between two strings.
     * 
     * This method uses a dynamic programming approach, but only keeps two rows
     * of the matrix in memory at any time, reducing space complexity to O(min(m, n)).
     * The function also swaps the strings if necessary to ensure the shorter string
     * is used for the columns, further optimizing memory usage.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @return {MetricCompute<SmithWatermanRaw>} - Object containing the similarity result and raw score
     */
    override compute ( a: string, b: string, m: number, n: number ) : MetricCompute<SmithWatermanRaw> {

        // Scoring parameters (can be customized via options if needed)
        const { match = 2, mismatch = -1, gap = -2 } = this.options;

        // Get two reusable arrays from the Pool for the DP rows
        const len: number = m + 1;
        const [ prev, curr ] = Pool.acquireMany( 'uint16', [ len, len ] );

        // Initialize the first row to zeros (Smith-Waterman local alignment)
        for ( let i = 0; i <= m; i++ ) prev[ i ] = 0;

        let maxScore: number = 0;

        // Fill the DP matrix row by row (over the longer string)
        for ( let j = 1; j <= n; j++ ) {

            // First column always zero
            curr[ 0 ] = 0;

            // Get the character code of the current character in b
            const cb: number = b.charCodeAt( j - 1 );

            for ( let i = 1; i <= m; i++ ) {

                // Score for match / mismatch
                const score: number = a.charCodeAt( i - 1 ) === cb ? match : mismatch;

                // Calculate the maximum score for current cell
                curr[ i ] = Math.max( 0,
                    prev[ i - 1 ] + score,   // Diagonal (match/mismatch)
                    prev[ i ] + gap,         // Up (gap)
                    curr[ i - 1 ] + gap      // Left (gap)
                );

                // Track the maximum score in the matrix
                if ( curr[ i ] > maxScore ) maxScore = curr[ i ];

            }

            // Copy current row to previous for next iteration
            prev.set( curr );

        }

        // Release arrays back to the pool
        Pool.release( 'uint16', prev, len );
        Pool.release( 'uint16', curr, len );

        // Use the maximum possible score for the shorter string (local alignment)
        const denum = Math.min( m * match, n * match );

        // Return the result as a MetricCompute object
        return {
            res: denum === 0 ? 0 : Metric.clamp( maxScore / denum ),
            raw: { score: maxScore, denum }
        };

    }

}