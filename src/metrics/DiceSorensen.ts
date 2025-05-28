/**
 * Dice-Sørensen Coefficient
 * src/metrics/DiceSorensen.ts
 * 
 * @see https://en.wikipedia.org/wiki/Dice-S%C3%B8rensen_coefficient
 * 
 * This module implements the Dice-Sørensen coefficient, a statistic used to gauge
 * the similarity of two samples. It is commonly used in natural language processing
 * and information retrieval to compare the similarity between two sets of data,
 * such as text documents. The coefficient is defined as twice the size of the
 * intersection divided by the sum of the sizes of the two sets.
 * 
 * The implementation includes methods to compute bigrams from strings and calculate
 * the coefficient based on these bigrams. It handles edge cases, such as empty
 * strings and identical strings, to ensure accurate results.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Helper } from '../utils/Helper';

/**
 * DiceSorensen class extends the Metric class to implement the Dice-Sørensen coefficient.
 */
export default class DiceSorensen extends Metric {

    /**
     * Constructor for the DiceSorensen class.
     * 
     * Initializes the DiceSorensen metric with two input strings or
     * arrays of strings and optional options.
     * 
     * @constructor
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     */
    constructor (
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        // Call the parent Metric constructor with the metric name and inputs
        super( 'dice', a, b, options );

    }

    /**
     * Computes the bigrams of a given string.
     * 
     * @private
     * @param {string} str - The input string
     * @return {Set<string>} - A set of bigrams (two-character sequences) from the string
     */
    private _bigrams ( str: string ) : Set<string> {

        const bigrams: Set<string> = new Set ();

        for ( let i = 0; i < str.length - 1; i++ ) {

            bigrams.add( str.substring( i, i + 2 ) );

        }

        return bigrams;

    }

    /**
     * Calculates the Dice-Sørensen coefficient between two strings.
     * 
     * @protected
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @return {MetricCompute} - Object containing the similarity result and raw distance
     */
    protected algo ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute {

        // Edge cases: if both strings are empty or identical, return 1; if either is empty, return 0
        if ( a === b ) return { res: 1 };
        if ( m < 2 || n < 2 ) return { res: 0 };

        // Always use the shorter string for columns to save memory
        [ a, b, m, n ] = Helper.swap( a, b, m, n );

        // Generate bigrams for both strings
        const setA: Set<string> = this._bigrams( a );
        const setB: Set<string> = this._bigrams( b );

        // Calculate the intersection of bigrams
        let intersection: number = 0;

        for ( const bigram of setA ) {

            if ( setB.has( bigram ) ) intersection++;

        }

        // Calculate the size of the union of both sets
        const size: number = setA.size + setB.size;

        // Return the result as a MetricCompute object
        return {
            res: size === 0 ? 1 : ( 2 * intersection ) / size,
            raw: { intersection, size }
        };

    }

}