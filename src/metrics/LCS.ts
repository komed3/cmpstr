/**
 * Longest Common Subsequence (LCS)
 * src/metrics/LCS.ts
 * 
 * @see https://en.wikipedia.org/wiki/Longest_common_subsequence
 * 
 * The Longest Common Subsequence (LCS) metric measures the length of the longest
 * subsequence common to both strings. Unlike substrings, the characters of a
 * subsequence do not need to be contiguous, but must appear in the same order.
 * The LCS is widely used in diff tools, bioinformatics, and approximate string
 * matching.
 * 
 * This implementation is highly optimized for both time and memory efficiency.
 * It uses only two rows of the dynamic programming matrix at any time, and always
 * iterates over the shorter string for memory efficiency (a is always the shorter
 * string in (a, b)).
 * 
 * @module Metric/LCS
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

export interface LCSRaw {
    lcs: number;
    maxLen: number;
};

/**
 * LCSMetric class extends the Metric class to implement the Longest Common Subsequence algorithm.
 */
export default class LCSMetric extends Metric<LCSRaw> {

    /**
     * Constructor for the LCSMetric class.
     * 
     * Initializes the LCS metric with two input strings or
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
        super ( 'lcs', a, b, options, true );

    }

    /**
     * Calculates the normalized LCS similarity between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute<LCSRaw>} - Object containing the similarity result and raw LCS length
     */
    protected override compute (
        a: string, b: string, m: number, n: number,
        maxLen: number
    ) : MetricCompute<LCSRaw> {

        // Get two reusable arrays from the Pool for the DP rows
        const len: number = m + 1;
        const [ prev, curr ] = Pool.acquireMany( 'uint16', [ len, len ] );

        // Initialize the first row to zeros
        for ( let i = 0; i <= m; i++ ) prev[ i ] = 0;

        // Fill the DP matrix row by row (over the longer string)
        for ( let j = 1; j <= n; j++ ) {

            curr[ 0 ] = 0;

            // Get the character code of the current character in b
            const cb: number = b.charCodeAt( j - 1 );

            for ( let i = 1; i <= m; i++ ) {

                // If characters match, increment the LCS length
                if ( a.charCodeAt( i - 1 ) === cb ) curr[ i ] = prev[ i - 1 ] + 1;

                // Otherwise, take the maximum of the left or above cell
                else curr[ i ] = Math.max( prev[ i ], curr[ i - 1 ] );

            }

            // Copy current row to previous for next iteration
            prev.set( curr );

        }

        // The last value in prev is the LCS length
        const lcs: number = prev[ m ];

        // Release arrays back to the pool
        Pool.release( 'uint16', prev, len );
        Pool.release( 'uint16', curr, len );

        // Normalize by the length of the longer string
        return {
            res: maxLen === 0 ? 1 : Metric.clamp( lcs / maxLen ),
            raw: { lcs, maxLen }
        };

    }

}