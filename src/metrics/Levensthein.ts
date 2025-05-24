/**
 * Levenshtein Distance
 * src/metrics/Levensthein.ts
 * 
 * The Levenshtein distance between two strings is the minimum number of
 * single-character edits (i.e. insertions, deletions or substitutions)
 * required to change one word into the other.
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
 * @param a - First string.
 * @param b - Second string.
 * @returns MetricResult containing the metric name, input strings, raw distance, and similarity result.
 */
export default (
    a: string,
    b: string
) : MetricResult => {

    let m : number = a.length;
    let n : number = b.length;
    const maxLen : number = Math.max( m, n );

    let raw : number;

    // Check for empty strings
    if ( a === b ) raw = 0;
    else if ( m === 0 ) raw = n;
    else if ( n === 0 ) raw = m;

    else {

        // Use always the shorter string as columns (save memory)
        [ a, b, m, n ] = m > n ? [ b, a, n, m ] : [ a, b, m, n ];

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
                    prev[ i - 1 ] + cost  // replacement
                );

            }

            // Swap the lines
            [ prev, curr ] = [ curr, prev ];

        }

        raw = prev[ m ];

    }

    // Calculate string similarity
    const res = maxLen === 0 ? 1 : 1 - raw / maxLen;

    // Return the result
    return {
        metric: 'levensthein',
        a, b, raw, res
    };

};