/**
 * Longest Common Subsequence (LCS)
 * src/metrics/LCS.ts
 * 
 * LCS measures the length of the longest subsequence common to both strings.
 * 
 * @see https://en.wikipedia.org/wiki/Longest_common_subsequence
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @since 2.0.0
 */

'use strict';

import type { MetricResult } from '../utils/Types.js';

/**
 * Calculate the LCS of two strings.
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
    if ( a === b ) raw = m;
    else if ( m === 0 || n === 0 ) raw = 0;

    else {

        // Use always the shorter string as columns (save memory)
        if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

        let prev : number[] = new Array ( m + 1 ).fill( 0 );
        let curr : number[] = new Array ( m + 1 ).fill( 0 );

        // Loop through the characters of the second string
        for ( let j = 1; j <= n; j++ ) {

            for ( let i = 1; i <= m; i++ ) {

                if ( a[ i - 1 ] === b[ j - 1 ] ) {

                    curr[ i ] = prev[ i - 1 ] + 1;

                } else {

                    curr[ i ] = Math.max( prev[ i ], curr[ i - 1 ] );

                }

            }

            // Swap the lines
            [ prev, curr ] = [ curr, prev ];

        }

        // Save the LCS result
        raw = prev[ m ];

    }

    // Calculate string similarity
    const res = maxLen === 0 ? 1 : raw / maxLen;

    return {
        metric: 'lcs',
        a, b, raw, res
    };

};