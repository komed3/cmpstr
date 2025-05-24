/**
 * Levenshtein Distance
 * src/metrics/Levenshtein.ts
 * 
 * The Levenshtein distance is a metric for measuring the difference between
 * two strings. It is defined as the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string
 * into the other.
 * 
 * @see https://en.wikipedia.org/wiki/Levenshtein_distance
 * 
 * Optimized for performance and batch processing by reusing row arrays.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 1.0.0
 */

'use strict';

import type { MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper function to calculate the Levenshtein distance between two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {number[]} [prev] - Previous row array for optimization (i-1)
 * @param {number[]} [curr] - Current row array for optimization (i)
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
    if ( a === b ) dist = 0;
    else if ( m === 0 ) dist = n;
    else if ( n === 0 ) dist = m;

    else {

        // Use always the shorter string as columns (save memory)
        if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

        // Initialize row arrays if not provided
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

            }

            // Swap the lines
            [ prev, curr ] = [ curr, prev ];

        }

        // Save the Levenshtein distance
        dist = prev[ m ];

    }

    // Calculate normalized string similarity
    const res : number = maxLen === 0 ? 1 : 1 - dist / maxLen;

    // Return the result
    return {
        metric: 'levenshtein', a, b, res,
        raw: { dist }
    };

};

/**
 * Calculate the Levenshtein distance between two strings or a string and an array of strings.
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

        let prev : number[] = new Array ( m + 1 );
        let curr : number[] = new Array ( m + 1 );

        // Batch comparison
        return b.map( s => _single( a, s, prev, curr ) );

    }

    // Single comparison
    return _single( a, b );

};