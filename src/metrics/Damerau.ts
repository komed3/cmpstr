/**
 * Damerau-Levenshtein Distance
 * src/metrics/Damerau.ts
 * 
 * The Damerau-Levenshtein distance extends the classical Levenshtein distance
 * by allowing transpositions of two adjacent characters as a single operation.
 * Useful for typo correction.
 * 
 * @see https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
 * 
 * Optimized for performance and batch processing by reusing row arrays.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 2.0.0
 */

'use strict';

import type { MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper function to calculate the Damerau-Levenshtein distance between two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {number[]} [test] - Row array for optimization (i-2)
 * @param {number[]} [prev] - Previous row array for optimization (i-1)
 * @param {number[]} [curr] - Current row array for optimization (i)
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    test? : number[],
    prev? : number[],
    curr? : number[]
) : MetricSingleResult => {

    let m : number = a.length;
    let n : number = b.length;
    const maxLen : number = Math.max( m, n );

    let dist : number;

    // Check for equal or empty strings
    if ( a === b ) dist = 0;
    else if ( m === 0 ) dist = n;
    else if ( n === 0 ) dist = m;

    else {

        // Use always the shorter string as columns (save memory)
        if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

        // Initialize row arrays if not provided
        test = test || new Array ( m + 1 );
        prev = prev || new Array ( m + 1 );
        curr = curr || new Array ( m + 1 );

        // Initialization of the first line
        for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

        // Loop through the characters of the second string
        for ( let j = 1; j <= n; j++ ) {

            curr[ 0 ] = j;

            for ( let i = 1; i <= m; i++ ) {

                const cost : number = a[ i - 1 ] === b[ j - 1 ] ? 0 : 1;

                curr[ i ] = Math.min(
                    curr[ i - 1 ] + 1,    // Insertion
                    prev[ i ] + 1,        // Deletion
                    prev[ i - 1 ] + cost  // Substitution
                );

                // Transposition
                if (
                    i > 1 && j > 1 &&
                    a[ i - 1 ] === b[ j - 2 ] &&
                    a[ i - 2 ] === b[ j - 1 ]
                ) {

                    curr[ i ] = Math.min(
                        curr[ i ],
                        test[ i - 2 ] + cost
                    );

                }

            }

            // Rotate the lines
            [ test, prev, curr ] = [ prev, curr, test ];

        }

        // Save the Damerau-Levenshtein distance
        dist = prev[ m ];

    }

    // Calculate normalized string similarity
    const res : number = maxLen === 0 ? 1 : 1 - dist / maxLen;

    // Return the result
    return {
        metric: 'damerau', a, b, res,
        raw: { dist }
    };

};

/**
 * Calculate the Damerau-Levenshtein between two strings or a string and an array of strings.
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

        let test : number[] = new Array ( m + 1 );
        let prev : number[] = new Array ( m + 1 );
        let curr : number[] = new Array ( m + 1 );

        // Batch comparison
        return b.map( s => _single( a, s, test, prev, curr ) );

    }

    // Single comparison
    return _single( a, b );

};