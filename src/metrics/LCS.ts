/**
 * Longest Common Subsequence (LCS)
 * src/metrics/LCS.ts
 * 
 * The Longest Common Subsequence (LCS) is a classic problem in computer science
 * that finds the longest subsequence present in both strings. A subsequence is
 * a sequence that can be derived from another sequence by deleting some elements
 * without changing the order of the remaining elements.
 * 
 * @see https://en.wikipedia.org/wiki/Longest_common_subsequence
 * 
 * Optimized for performance and batch processing by reusing row arrays.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @since 2.0.0
 */

'use strict';

import type { MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper function to calculate the LCS of two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {number[]} prev - Previous row array for optimization (i-1)
 * @param {number[]} curr - Current row array for optimization (i)
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    prev? : number[],
    curr? : number[]
) : MetricSingleResult => {

    let m : number = a.length;
    let n : number = b.length;
    const maxLen : number = Math.max( m, n );

    let dist : number;

    // Check for equal or empty strings
    if ( a === b ) dist = m;
    else if ( m === 0 || n === 0 ) dist = 0;

    else {

        // Use always the shorter string as columns (save memory)
        if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

        prev = prev || new Array ( m + 1 ).fill( 0 );
        curr = curr || new Array ( m + 1 ).fill( 0 );

        // Loop through the characters of the second string
        for ( let j = 1; j <= n; j++ ) {

            for ( let i = 1; i <= m; i++ ) {

                if ( a[ i - 1 ] === b[ j - 1 ] ) {

                    // If characters match, increment the LCS length
                    curr[ i ] = prev[ i - 1 ] + 1;

                } else {

                    // If characters do not match, take the maximum of the previous values
                    curr[ i ] = Math.max( prev[ i ], curr[ i - 1 ] );

                }

            }

            // Swap the lines
            [ prev, curr ] = [ curr, prev ];

        }

        // Save the LCS result
        dist = prev[ m ];

    }

    // Calculate normalized string similarity
    const res : number = maxLen === 0 ? 1 : dist / maxLen;

    // Return the result
    return {
        metric: 'lcs', a, b, res,
        raw: { dist }
    };

};

/**
 * Calculate the LCS of two strings or a string and an array of strings.
 * 
 * @exports
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @returns {MetricResult} metric result(s)
 */
export default (
    a : string,
    b : string | string[]
) : MetricResult => {

    // Batch mode
    if ( Array.isArray( b ) ) {

        // Reuse row arrays for all comparisons (performance)
        const m : number = a.length;

        let prev : number[] = new Array ( m + 1 ).fill( 0 );
        let curr : number[] = new Array ( m + 1 ).fill( 0 );

        // Batch comparison
        return b.map( s => _single( a, s, prev, curr ) );

    }

    // Single comparison
    return _single( a, b );

};