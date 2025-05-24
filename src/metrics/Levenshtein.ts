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
 * @author Paul Köhler (komed3)
 * @license MIT
 * @since 1.0.0
 */

'use strict';

import type { MetricResult } from '../utils/Types.js';

/**
 * Calculate the Levenshtein distance between two strings.
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

    let raw : number;

    // Check for equal or empty strings
    if ( a === b ) raw = 0;
    else if ( m === 0 ) raw = n;
    else if ( n === 0 ) raw = m;

    else {

        // Use always the shorter string as columns (save memory)
        if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

        let prev : number[] = new Array ( m + 1 );
        let curr : number[] = new Array ( m + 1 );

        // Initialization of the first line
        for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

        // Loop through the characters of the second string
        for ( let j = 1; j <= n; j++ ) {

            curr[ 0 ] = j;

            for ( let i = 1; i <= m; i++ ) {

                const cost : number = a[ i - 1 ] === b[ j - 1 ] ? 0 : 1;

                curr[ i ] = Math.min(
                    curr[ i - 1 ] + 1,    // insertion
                    prev[ i ] + 1,        // deletion
                    prev[ i - 1 ] + cost  // substitution
                );

            }

            // Swap the lines
            [ prev, curr ] = [ curr, prev ];

        }

        // Save the levenshtein distance
        raw = prev[ m ];

    }

    // Calculate normalized string similarity
    const res : number = maxLen === 0 ? 1 : 1 - raw / maxLen;

    // Return the result
    return {
        metric: 'levenshtein',
        a, b, raw, res
    };

};