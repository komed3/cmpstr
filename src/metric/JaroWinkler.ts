/**
 * Jaro-Winkler Distance
 * src/metric/JaroWinkler.ts
 * 
 * @see https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
 * 
 * The Jaro-Winkler distance is a string similarity metric that gives more weight
 * to matching characters at the start of the strings. It is especially effective
 * for short strings and typographical errors, and is widely used in record linkage
 * and duplicate detection.
 * 
 * This implementation is highly optimized for both time and memory efficiency.
 * It uses the Pool for temporary boolean arrays and avoids unnecessary allocations.
 * All calculations are performed in a single pass where possible.
 * 
 * @module Metric/JaroWinkler
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

export interface JaroWinklerRaw {
    matchWindow: number;
    matches: number;
    transpos: number;
    jaro: number;
    prefix: number;
};

/**
 * JaroWinklerDistance class extends the Metric class to implement the Jaro-Winkler algorithm.
 */
export default class JaroWinklerDistance extends Metric<JaroWinklerRaw> {

    /**
     * Constructor for the JaroWinklerDistance class.
     * 
     * Initializes the Jaro-Winkler metric with two input strings or
     * arrays of strings and optional options.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     */
    constructor (
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        // Call the parent Metric constructor with the metric name and inputs
        // Metric is symmetrical
        super ( 'jaro-winkler', a, b, options, true );

    }

    /**
     * Calculates the Jaro-Winkler similarity between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @return {MetricCompute<JaroWinklerRaw>} - Object containing the similarity result and raw values
     */
    protected override compute ( a: string, b: string, m: number, n: number ) : MetricCompute<JaroWinklerRaw> {

        // Find matches
        const matchWindow: number = Math.max( 0, Math.floor( n / 2 ) - 1 );

        // Use Pool for boolean arrays
        const matchA: Uint16Array = Pool.acquire( 'uint16', m );
        const matchB: Uint16Array = Pool.acquire( 'uint16', n );

        // Initialize match arrays
        for ( let i = 0; i < m; i++ ) matchA[ i ] = 0;
        for ( let i = 0; i < n; i++ ) matchB[ i ] = 0;

        // Find matches within the match window
        let matches: number = 0;

        for ( let i = 0; i < m; i++ ) {

            const start: number = Math.max( 0, i - matchWindow );
            const end: number = Math.min( i + matchWindow + 1, n );

            for ( let j = start; j < end; j++ ) {

                if ( ! matchB[ j ] && a[ i ] === b[ j ] ) {

                    matchA[ i ] = 1;
                    matchB[ j ] = 1;
                    matches++;

                    break;

                }

            }

        }

        // Set initial values for transpositions, jaro distance, prefix and result
        let transpos: number = 0, jaro: number = 0, prefix: number = 0, res: number = 0;

        // If matches are found, proceed with further calculations
        if ( matches > 0 ) {

            // Count transpositions
            let k: number = 0;

            for ( let i = 0; i < m; i++ ) {

                if ( matchA[ i ] ) {

                    while ( ! matchB[ k ] ) k++;

                    if ( a[ i ] !== b[ k ] ) transpos++;

                    k++;

                }

            }

            transpos /= 2;

            // Calculate Jaro similarity
            jaro = (
                ( matches / m ) + ( matches / n ) +
                ( matches - transpos ) / matches
            ) / 3;

            // Calculate common prefix length (max 4)
            for ( let i = 0; i < Math.min( 4, m, n ); i++ ) {

                if ( a[ i ] === b[ i ] ) prefix++;
                else break;

            }

            // Step 5: Calculate Jaro-Winkler similarity
            res = jaro + prefix * 0.1 * ( 1 - jaro );

        }

        // Release arrays back to the pool
        Pool.release( 'uint16', matchA, m );
        Pool.release( 'uint16', matchB, n );

        // Return the result as a MetricCompute object
        return {
            res: Metric.clamp( res ),
            raw: { matchWindow, matches, transpos, jaro, prefix }
        };

    }

}