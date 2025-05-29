/**
 * Hamming Distance
 * src/metrics/Hamming.ts
 * 
 * @see https://en.wikipedia.org/wiki/Hamming_distance
 * 
 * The Hamming distance is a metric for comparing two strings of equal length. It
 * measures the number of positions at which the corresponding symbols are different.
 * This implementation allows for optional padding of the shorter string to equalize
 * lengths, otherwise it throws an error if the strings are of unequal length.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';

/**
 * Hamming class extends the Metric class to implement the Hamming distance.
 */
export default class Hamming extends Metric {

    /**
     * Constructor for the Hamming class.
     * 
     * Initializes the Hamming distance metric with two input strings or
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
        super( 'hamming', a, b, options );

    }

    /**
     * Calculates the Hamming distance between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute} - Object containing the similarity result and raw distance
     * @throws {Error} - If strings are of unequal length and padding is not specified
     */
    override compute ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute {

        // Check for equal string length
        if ( m !== n ) {

            // Optional: use padding to equalize string length
            if ( this.options.pad !== undefined ) {

                if ( m < maxLen ) a = a.padEnd( maxLen, this.options.pad );
                if ( n < maxLen ) b = b.padEnd( maxLen, this.options.pad );

                m = n = maxLen;

            }

            // Standard: Error for unequal length
            else throw new Error (
                `strings must be of equal length for Hamming Distance, a=${m} and b=${n} given`
            );

        }

        // If strings are identical, distance is zero
        let dist: number = 0;

        // Otherwise, perform the Hamming distance algorithm
        if ( a !== b ) {

            // Calculate the Hamming distance
            for ( let i = 0; i < a.length; i++ ) {

                if ( a[ i ] !== b[ i ] ) dist++;

            }

        }

        // Return the result as a MetricCompute object
        return {
            res: Metric.norm( dist, m ),
            raw: { dist }
        };

    }

}