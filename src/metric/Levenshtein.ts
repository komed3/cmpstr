/**
 * Levenshtein Distance
 * src/metric/Levenshtein.ts
 * 
 * @see https://en.wikipedia.org/wiki/Levenshtein_distance
 * 
 * The Levenshtein distance is a classic metric for measuring the minimum number
 * of single-character edits (insertions, deletions, or substitutions) required
 * to change one string into another. It is widely used in approximate string
 * matching, spell checking, and natural language processing.
 * 
 * This implementation is highly optimized for both time and memory efficiency.
 * It uses only two rows of the dynamic programming matrix at any time, and
 * supports batch processing for comparing multiple string pairs efficiently.
 * 
 * @module Metric/LevenshteinDistance
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric, MetricRegistry } from './Metric';
import { Pool } from '../utils/Pool';

export interface LevenshteinRaw {
    dist: number;
    maxLen: number;
};

/**
 * LevenshteinDistance class extends the Metric class to implement the Levenshtein distance algorithm.
 */
export default class LevenshteinDistance extends Metric<LevenshteinRaw> {

    /**
     * Constructor for the Levenshtein class.
     * 
     * Initializes the Levenshtein metric with two input strings
     * or arrays of strings and optional options.
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
        super ( 'levenshtein', a, b, options, true );

    }

    /**
     * Calculates the Levenshtein distance between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute<LevenshteinRaw>} - Object containing the similarity result and raw distance
     */
    protected override compute (
        a: string, b: string, m: number, n: number,
        maxLen: number
    ) : MetricCompute<LevenshteinRaw> {

        // Get two reusable arrays from the Pool for the DP rows
        const len: number = m + 1;
        const [ prev, curr ] = Pool.acquireMany( 'uint16', [ len, len ] );

        // Initialize the first row (edit distances from empty string to a)
        for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

        // Fill the DP matrix row by row (over the longer string)
        for ( let j = 1; j <= n; j++ ) {

            // Cost of transforming empty string to b[0..j]
            curr[ 0 ] = j;

            // Get the character code of the current character in b
            const cb: number = b.charCodeAt( j - 1 );

            for ( let i = 1; i <= m; i++ ) {

                // Cost is 0 if characters match, 1 otherwise
                const cost: number = a.charCodeAt( i - 1 ) === cb ? 0 : 1;

                // Calculate the minimum edit distance for current cell
                curr[ i ] = Math.min(
                    curr[ i - 1 ] + 1,      // Insertion
                    prev[ i ] + 1,          // Deletion
                    prev[ i - 1 ] + cost    // Substitution
                );

            }

            // Copy current row to previous for next iteration
            prev.set( curr );

        }

        // The last value in prev is the Levenshtein distance
        const dist: number = prev[ m ];

        // Release arrays back to the pool
        Pool.release( 'uint16', prev, len );
        Pool.release( 'uint16', curr, len );

        // Return the result as a MetricCompute object
        return {
            res: maxLen === 0 ? 1 : Metric.clamp( 1 - dist / maxLen ),
            raw: { dist, maxLen }
        };

    }

}

// Register the Levenshtein distance in the metric registry
MetricRegistry.add( 'levenshtein', LevenshteinDistance );