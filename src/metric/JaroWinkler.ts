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
 * @module Metric/JaroWinkler
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric, MetricRegistry } from './Metric';
import { Pool } from '../utils/Pool';

export interface JaroWinklerRaw {
    matchWindow: number;
    matches: number;
    transpos: number;
    jaro: number;
    prefix: number;
}

/**
 * JaroWinklerDistance class extends the Metric class to implement the Jaro-Winkler algorithm.
 */
export class JaroWinklerDistance extends Metric< JaroWinklerRaw > {

    /**
     * Constructor for the JaroWinklerDistance class.
     * 
     * Initializes the Jaro-Winkler metric with two input strings or
     * arrays of strings and optional options.
     * 
     * Metric is symmetrical.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} [opt] - Options for the metric computation
     */
    constructor ( a: MetricInput, b: MetricInput, opt: MetricOptions = {} ) {
        super ( 'jaroWinkler', a, b, opt, true );
    }

    /**
     * Calculates the Jaro-Winkler similarity between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @return {MetricCompute< JaroWinklerRaw >} - Object containing the similarity result and raw values
     */
    protected override compute ( a: string, b: string, m: number, n: number ) : MetricCompute< JaroWinklerRaw > {
        // Use Pool for boolean arrays
        const [ matchA, matchB ] = Pool.acquireMany< Uint16Array >( 'uint16', [ m, n ] );

        try {
            // Initialize match arrays
            for ( let i = 0; i < m; i++ ) matchA[ i ] = 0;
            for ( let i = 0; i < n; i++ ) matchB[ i ] = 0;

            // Find matches
            const matchWindow: number = Math.max( 0, Math.floor( n / 2 ) - 1 );

            // Find matches within the match window
            let matches = 0;
            for ( let i = 0; i < m; i++ ) {
                const start = Math.max( 0, i - matchWindow );
                const end = Math.min( i + matchWindow + 1, n );

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
            let transpos = 0, jaro = 0, prefix = 0, res = 0;

            // If matches are found, proceed with further calculations
            if ( matches > 0 ) {
                // Count transpositions
                let k = 0;
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

            // Return the result as a MetricCompute object
            return {
                res: Metric.clamp( res ),
                raw: { matchWindow, matches, transpos, jaro, prefix }
            };
        } finally {
            // Release arrays back to the pool
            Pool.release( 'uint16', matchA, m );
            Pool.release( 'uint16', matchB, n );
        }
    }

}

// Register the Jaro-Winkler distance in the metric registry
MetricRegistry.add( 'jaroWinkler', JaroWinklerDistance );
