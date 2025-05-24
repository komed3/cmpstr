/**
 * Needleman-Wunsch Algorithm
 * src/metrics/NeedlemanWunsch.ts
 * 
 * The Needleman-Wunsch algorithm is a dynamic programming algorithm for
 * computing the optimal alignment between two sequences. It is commonly
 * used in bioinformatics for sequence alignment, but can also be applied
 * to strings in general. The algorithm finds the best alignment by
 * maximizing the score based on match, mismatch, and gap penalties.
 * 
 * @see https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
 * 
 * Optimized for performance and batch processing by reusing row arrays.
 * 
 * @author Paul Köhler
 * @license MIT
 * @package CmpStr
 * @since 2.0.0
 */

'use strict';

import type { MetricOptions, MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper function to calculate the Needleman-Wunsch score between two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {number} match - Score for a match
 * @param {number} mismatch - Penalty for a mismatch
 * @param {number} gap - Penalty for a gap
 * @param {number[]} prev - Previous row array for optimization (i-1)
 * @param {number[]} curr - Current row array for optimization (i)
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    match : number,
    mismatch : number,
    gap : number,
    prev? : number[],
    curr? : number[]
) : MetricSingleResult => {

    let m : number = a.length;
    let n : number = b.length;
    const maxLen : number = Math.max( m, n );

    let score : number;

    // Check for equal or empty strings
    if ( a === b ) score = m * match;
    else if ( m === 0 && n === 0 ) score = 0;
    else if ( m === 0 || n === 0 ) score = gap * Math.max( m, n );

    else {

        // Use always the shorter string as columns (save memory)
        if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

        // Initialize row arrays if not provided
        prev = prev || new Array ( n + 1 );
        curr = curr || new Array ( n + 1 );

        // Initialization of the first line
        for ( let j = 0; j <= n; j++ ) prev[ j ] = j === 0 ? 0 : prev[ j - 1 ] + gap;

        // Loop through the characters of the first string
        for ( let i = 1; i <= m; i++ ) {

            curr[ 0 ] = prev[ 0 ] + gap;

            for ( let j = 1; j <= n; j++ ) {

                const matchScore : number = a[ i - 1 ] === b[ j - 1 ] ? match : mismatch;

                curr[ j ] = Math.max(
                    prev[ j - 1 ] + matchScore,  // Diagonal (match/mismatch)
                    prev[ j ] + gap,             // Up (gap)
                    curr[ j - 1 ] + gap          // Left (gap)
                );

            }

            // Swap the lines
            [ prev, curr ] = [ curr, prev ];

        }

        // Save the Needleman-Wunsch score
        score = prev[ n ];

    }

    // Calculate normalized string similarity
    const res : number = maxLen === 0 ? 1 : (
        Math.max( 0, Math.min( 1, score / ( maxLen * match ) ) )
    );

    // Return the result
    return {
        metric: 'needlemanWunsch', a, b, res,
        raw: { score }
    };

};

/**
 * Calculate Needleman-Wunsch between two strings or a string and an array of strings.
 * 
 * @exports
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @param {number} options.match - Score for a match (default: 1)
 * @param {number} options.mismatch - Penalty for a mismatch (default: -1)
 * @param {number} options.gap - Penalty for a gap (default: -1)
 * @returns {MetricResult} metric result(s)
 */
export default (
    a : string,
    b : string | string[],
    { match = 1, mismatch = -1, gap = -1 } : MetricOptions = {}
) : MetricResult => {

    match = Number( match );
    mismatch = Number( mismatch );
    gap = Number( gap );

    // Batch mode
    if ( Array.isArray( b ) ) {

        // Reuse row arrays for all comparisons (performance)
        const m : number = a.length;

        let prev : number[] = new Array ( m + 1 );
        let curr : number[] = new Array ( m + 1 );

        // Batch comparison
        return b.map( s => _single( a, s, match, mismatch, gap, prev, curr ) );

    }

    // Single comparison
    return _single( a, b, match, mismatch, gap );

};