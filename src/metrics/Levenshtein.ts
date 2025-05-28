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
 */

'use strict';

import type { MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Helper } from '../utils/Helper';
import { Pool } from '../utils/Pool';

/**
 * Levenshtein class extends the Metric class to implement the Levenshtein distance algorithm.
 */
export default class Levenshtein extends Metric {

    // Metric name for identification
    protected metric: string = 'levenshtein';

    /**
     * Calculates the Levenshtein distance between two strings.
     * 
     * @param a - First string
     * @param b - Second string
     * @param m - Length of the first string
     * @param n - Length of the second string
     * @param maxLen - Maximum length of the strings
     * @return MetricCompute - Object containing the similarity result and raw distance
     */
    protected algo ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute {

        // Set distance to max possible length
        let dist: number = maxLen;

        // If strings are identical, distance is zero
        if ( a === b ) dist = 0;

        // If one string is empty, distance is the length of the other
        else if ( m === 0 ) dist = n;
        else if ( n === 0 ) dist = m;

        // Perform the Levenshtein algorithm
        else {

            // Always use the shorter string for columns to save memory
            [ a, b, m, n ] = Helper.swap( a, b, m, n );

            // Get two reusable arrays from the Pool for the DP rows
            const [ prev, curr ] = Pool.get( m + 1 );

            // Initialize the first row (edit distances from empty string to a)
            for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

            // Fill the DP matrix row by row
            for ( let j = 1; j <= n; j++ ) {

                // Cost of transforming empty string to b[0..j]
                curr[ 0 ] = j;

                // Get the character code of the current character in b
                const cb: number = b.charCodeAt( j - 1 );

                for ( let i = 1; i <= m; i++ ) {

                    // Cost is 0 if characters match, 1 otherwise
                    const cost: number = a.charCodeAt( i - 1 ) === cb ? 0 : 1;

                    // Calculate the minimum edit distance for current cell
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
            dist = prev[ m ];

        }

        // Return the result as a MetricCompute object
        return {
            res: this.normalized( dist, maxLen ),
            raw: { dist }
        };

    }

}