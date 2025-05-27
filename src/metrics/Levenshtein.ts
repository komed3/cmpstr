/**
 * Levenshtein Distance
 * src/metrics/Levenshtein.ts
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
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 1.0.0
 */

'use strict';

import type { MetricInput, MetricOptions, MetricResult, MetricResultSingle } from '../utils/Types';
import { Pool } from '../utils/Pool';
import { Perf } from '../utils/Performance';

/**
 * Compute the Levenshtein distance between two strings.
 * 
 * This function uses a dynamic programming approach, but only keeps two rows
 * of the matrix in memory at any time, reducing space complexity to O(min(m,n)).
 * The function also swaps the strings if necessary to ensure the shorter string
 * is used for the columns, further optimizing memory usage.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {number} m - Length of string a
 * @param {number} n - Length of string b
 * @returns {number} - The Levenshtein distance between a and b
 */
const _levenshteinDistance = ( a: string, b: string, m: number, n: number ) : number => {

    // If strings are identical, distance is zero
    if ( a === b ) return 0;

    // If one string is empty, distance is the length of the other
    if ( m === 0 ) return n;
    if ( n === 0 ) return m;

    // Always use the shorter string for columns to save memory
    if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

    // Get two reusable arrays from the Pool for the DP rows
    const [ prev, curr ] = Pool.get( m + 1 );

    // Initialize the first row (edit distances from empty string to a)
    for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

    // Fill the DP matrix row by row
    for ( let j = 1; j <= n; j++ ) {

        // Cost of transforming empty string to b[0..j]
        curr[ 0 ] = j;

        const cb: number = b.charCodeAt( j - 1 );

        for ( let i = 1; i <= m; i++ ) {

            // Cost is 0 if characters match, 1 otherwise
            const cost: number = a.charCodeAt( i - 1 ) === cb ? 0 : 1;

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
    return prev[ m ];

};

/**
 * Compute the Levenshtein similarity and result object for a single string pair.
 * Optionally measures performance if a Perf instance is provided.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {Perf | null} perf - Optional performance measurement instance
 * @returns {MetricResultSingle} - Result object with similarity and raw distance
 */
const _single = ( a: string, b: string, perf: Perf | null ) : MetricResultSingle => {

    const m: number = a.length, n: number = b.length;
    const maxLen: number = Math.max( m, n );

    // Compute the Levenshtein distance
    const distance: number = _levenshteinDistance( a, b, m, n );

    // Normalize similarity to [0, 1] (1 = identical, 0 = completely different)
    const similarity: number = maxLen === 0 ? 1 : 1 - distance / maxLen;

    // Build result object, optionally including performance data
    return {
        metric: 'levenshtein', a, b, similarity, raw: { distance },
        ...( perf ? { perf: perf.get() } : {} )
    };

};

/**
 * Compute the Levenshtein similarity for one or more string pairs.
 * Supports batch processing: both a and b can be strings or arrays of strings.
 * All combinations of a[i] and b[j] are compared.
 * 
 * @param {MetricInput} a - First string or array of strings
 * @param {MetricInput} b - Second string or array of strings
 * @param {MetricOptions} [options] - Optional settings (e.g., perf for performance measurement)
 * @returns {MetricResult} - Single result or array of results for all combinations
 */
export default (
    a: MetricInput, b: MetricInput,
    options: MetricOptions = {}
) : MetricResult => {

    // Optionally start performance measurement
    const perf = options.perf ? new Perf () : null;

    // Single string comparison
    if ( typeof a === 'string' && typeof b === 'string' ) {

        return _single( a, b, perf );

    }

    // Batch processing: compare all combinations of a[] and b[]
    const results: MetricResultSingle[] = [];
    const A: string[] = Array.isArray( a ) ? a : [ a ];
    const B: string[] = Array.isArray( b ) ? b : [ b ];

    for ( let i = 0; i < A.length; i++ ) {

        const s: string = A[ i ];

        for ( let j = 0; j < B.length; j++ ) {

            results.push( _single( s, B[ j ], perf ) );

        }

    }

    return results;

};