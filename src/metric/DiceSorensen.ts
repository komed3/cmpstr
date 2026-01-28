/**
 * Dice-Sørensen Coefficient
 * src/metric/DiceSorensen.ts
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
 * @module Metric
 * @name DiceSorensenCoefficient
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricCompute, MetricInput, MetricOptions } from '../utils/Types';

import { Pool } from '../utils/Pool';
import { Metric, MetricRegistry } from './Metric';

export interface DiceRaw {
    intersection: number;
    size: number;
}

/**
 * DiceSorensenCoefficient class extends the Metric class to implement the Dice-Sørensen coefficient.
 */
export class DiceSorensenCoefficient extends Metric< DiceRaw > {

    /**
     * Constructor for the DiceSorensen class.
     * 
     * Initializes the DiceSorensen metric with two input strings or
     * arrays of strings and optional options.
     * 
     * Metric is symmetrical.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} [opt] - Options for the metric computation
     */
    constructor ( a: MetricInput, b: MetricInput, opt: MetricOptions = {} ) {
        super ( 'dice', a, b, opt, true );
    }

    /**
     * Computes the bigrams of a given string.
     * 
     * @param {string} str - The input string
     * @return {Set< string >} - A set of bigrams (two-character sequences) from the string
     */
    private _bigrams ( str: string ) : Set< string > {
        const len = str.length - 1;
        const bigrams = Pool.acquire< Set< string > >( 'set', len );

        // Generate bigrams by iterating through the string
        for ( let i = 0; i < len; i++ ) bigrams.add( str.substring( i, i + 2 ) );
        return bigrams;
    }

    /**
     * Calculates the Dice-Sørensen coefficient between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @return {MetricCompute< DiceRaw >} - Object containing the similarity result and raw distance
     */
    protected override compute ( a: string, b: string ) : MetricCompute< DiceRaw > {
        // Generate bigrams for both strings
        const setA = this._bigrams( a ), setB = this._bigrams( b );
        const sizeA = setA.size, sizeB = setB.size;

        try {
            // Calculate the intersection of bigrams
            let intersection = 0;
            for ( const bigram of setA ) if ( setB.has( bigram ) ) intersection++;

            // Calculate the size of the union of both sets
            const size = sizeA + sizeB;

            // Return the result as a MetricCompute object
            return {
                res: size === 0 ? 1 : Metric.clamp( ( 2 * intersection ) / size ),
                raw: { intersection, size }
            };
        } finally {
            // Release sets back to the pool
            Pool.release( 'set', setA, sizeA );
            Pool.release( 'set', setB, sizeB );
        }
    }

}

// Register the Dice-Sørensen coefficient in the metric registry
MetricRegistry.add( 'dice', DiceSorensenCoefficient );
