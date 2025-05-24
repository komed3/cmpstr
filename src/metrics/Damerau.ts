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
 * @author Paul Köhler (komed3)
 * @license MIT
 * @since 2.0.0
 */

'use strict';

import type { MetricResult } from '../utils/Types.js';

/**
 * Calculate the Damerau-Levenshtein distance between two strings.
 * 
 * @param a - First string
 * @param b - Second string
 * @returns MetricResult
 */
export default (
    a : string,
    b : string
) : MetricResult => {

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

        let test : number[] = new Array ( m + 1 );
        let prev : number[] = new Array ( m + 1 );
        let curr : number[] = new Array ( m + 1 );

        // Initialization of the first line
        for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

        // Loop through the characters of the second string
        for ( let j = 1; j <= n; j++ ) {

            curr[ 0 ] = j;

            for ( let i = 1; i <= m; i++ ) {

                const cost = a[ i - 1 ] === b[ j - 1 ] ? 0 : 1;

                curr[ i ] = Math.min(
                    curr[ i - 1 ] + 1,    // insertion
                    prev[ i ] + 1,        // deletion
                    prev[ i - 1 ] + cost  // substitution
                );

                // transposition
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

            // rotate the lines
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