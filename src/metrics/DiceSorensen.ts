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
 * @module Metric/DiceSorensenCoefficient
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

/**
 * DiceSorensenCoefficient class extends the Metric class to implement the Dice-Sørensen coefficient.
 */
export default class DiceSorensenCoefficient extends Metric {

    /**
     * Constructor for the DiceSorensen class.
     * 
     * Initializes the DiceSorensen metric with two input strings or
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
        super( 'dice', a, b, options, true );

    }

    /**
     * Computes the bigrams of a given string.
     * 
     * @param {string} str - The input string
     * @return {Set<string>} - A set of bigrams (two-character sequences) from the string
     */
    private _bigrams ( str: string ) : Set<string> {

        const len: number = str.length - 1;
        const bigrams: Set<string> = Pool.acquire( 'set', len );

        // Generate bigrams by iterating through the string
        for ( let i = 0; i < len; i++ ) bigrams.add( str.substring( i, i + 2 ) );

        return bigrams;

    }

    /**
     * Calculates the Dice-Sørensen coefficient between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @return {MetricCompute} - Object containing the similarity result and raw distance
     */
    override compute ( a: string, b: string ) : MetricCompute {

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