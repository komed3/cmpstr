/**
 * Damerau-Levenshtein Distance
 * src/metric/DamerauLevenshtein.ts
 * 
 * @see https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
 * 
 * The Damerau-Levenshtein distance extends the classical Levenshtein algorithm by
 * including transpositions (swapping of two adjacent characters) as a single edit
 * operation, in addition to insertions, deletions, and substitutions.
 * 
 * This metric is particularly useful for detecting and correcting common
 * typographical errors.
 * 
 * This implementation is highly optimized for both time and memory efficiency.
 * 
 * @module Metric/DamerauLevenshtein
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric, MetricRegistry } from './Metric';
import { Pool } from '../utils/Pool';

export interface DamerauRaw {
    dist: number;
    maxLen: number;
};

/**
 * DamerauLevenshteinDistance class extends the Metric class to implement the Damerau-Levenshtein algorithm.
 */
export class DamerauLevenshteinDistance extends Metric<DamerauRaw> {

    /**
     * Constructor for the DamerauLevenshteinDistance class.
     * 
     * Initializes the Damerau-Levenshtein metric with two input strings or
     * arrays of strings and optional options.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     * @param {MetricInput} [A] - Original first input
     * @param {MetricInput} [B] - Original second input
     */
    constructor (
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {},
        A?: MetricInput, B?: MetricInput
    ) {

        // Call the parent Metric constructor with the metric name and inputs
        // Metric is symmetrical
        super ( 'damerau', a, b, options, true, A, B );

    }

    /**
     * Calculates the normalized Damerau-Levenshtein distance between two strings.
     * 
     * This method uses a dynamic programming approach, but only keeps three rows
     * of the matrix in memory at any time, reducing space complexity to O(min(m, n)).
     * The function also swaps the strings if necessary to ensure the shorter string
     * is used for the columns, further optimizing memory usage.
     * 
     * @param {string} a - First string (always the shorter string for memory efficiency)
     * @param {string} b - Second string
     * @param {number} m - Length of the first string (a)
     * @param {number} n - Length of the second string (b)
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute<DamerauRaw>} - Object containing the similarity result and raw distance
     */
    protected override compute (
        a: string, b: string, m: number, n: number,
        maxLen: number
    ) : MetricCompute<DamerauRaw> {

        // Get three reusable arrays from the Pool for the DP rows
        const len: number = m + 1;
        const [ test, prev, curr ] = Pool.acquireMany( 'uint16', [ len, len, len ] );

        // Initialize the first row (edit distances from empty string to a)
        for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

        // Fill the DP matrix row by row (over the longer string)
        for ( let j = 1; j <= n; j++ ) {

            // Cost of transforming empty string to b[0..j]
            curr[ 0 ] = j;

            // Get the character code of the current character in b
            const cb: number = b.charCodeAt( j - 1 );

            for ( let i = 1; i <= m; i++ ) {

                // Get the character code of the current character in b
                const ca: number = a.charCodeAt( i - 1 );

                // If characters are the same, no cost for substitution
                const cost: number = ca === cb ? 0 : 1;

                // Calculate minimum of deletion, insertion, substitution
                let val: number = Math.min(
                    curr[ i - 1 ] + 1,      // Insertion
                    prev[ i ] + 1,          // Deletion
                    prev[ i - 1 ] + cost    // Substitution
                );

                // Check for transposition
                if (
                    i > 1 && j > 1 &&
                    ca === b.charCodeAt( j - 2 ) &&
                    cb === a.charCodeAt( i - 2 )
                ) {

                    // Transposition
                    val = Math.min( val, test[ i - 2 ] + cost );

                }

                // Set the cost for the current cell
                curr[ i ] = val;

            }

            // Rotate rows: test <= prev, prev <= curr, curr <= test
            test.set( prev ); prev.set( curr );

        }

        // The last value in prev is the Damerau-Levenshtein distance
        const dist: number = prev[ m ];

        // Release arrays back to the pool
        Pool.release( 'uint16', test, len );
        Pool.release( 'uint16', prev, len );
        Pool.release( 'uint16', curr, len );

        // Normalize by the length of the longer string
        return {
            res: maxLen === 0 ? 1 : Metric.clamp( 1 - ( dist / maxLen ) ),
            raw: { dist, maxLen }
        };

    }

}

// Register the Damerau-Levenshtein distance in the metric registry
MetricRegistry.add( 'damerau', DamerauLevenshteinDistance );