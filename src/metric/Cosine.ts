/**
 * Cosine Similarity
 * src/metric/Cosine.ts
 * 
 * @see https://en.wikipedia.org/wiki/Cosine_similarity
 * 
 * Cosine similarity is a metric used to measure how similar two vectors are, regardless
 * of their magnitude. In text analysis, it is commonly used to compare documents or
 * strings by representing them as term frequency vectors and computing the cosine of
 * the angle between these vectors.
 * 
 * The result is a value between 0 and 1, where 1 means the vectors are identical and 0
 * means they are orthogonal (no similarity).
 * 
 * @module Metric/CosineSimilarity
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricCompute, MetricInput, MetricOptions } from '../utils/Types';

import { Pool } from '../utils/Pool';
import { Metric, MetricRegistry } from './Metric';

export interface CosineRaw {
    dotProduct: number;
    magnitudeA: number;
    magnitudeB: number;
}

/**
 * CosineSimilarity class extends the Metric class to implement the Cosine similarity algorithm.
 */
export class CosineSimilarity extends Metric< CosineRaw > {

    /**
     * Constructor for the CosineSimilarity class.
     * 
     * Initializes the Cosine similarity metric with two input strings or
     * arrays of strings and optional options.
     * 
     * Metric is symmetrical.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} [opt] - Options for the metric computation
     */
    constructor ( a: MetricInput, b: MetricInput, opt: MetricOptions = {} ) {
        super ( 'cosine', a, b, opt, true );
    }

    /**
     * Calculates the term frequency vector for a given string.
     * 
     * @param {string} str - The input string
     * @param {string} delimiter - The delimiter to split terms
     * @return {Map< string, number >} - Term frequency object
     */
    private _termFreq ( str: string, delimiter: string ) : Map< string, number > {
        const terms = str.split( delimiter );
        const freq = Pool.acquire< Map< string, number > >( 'map', terms.length );

        for ( const term of terms ) freq.set( term, ( freq.get( term ) || 0 ) + 1 );
        return freq;
    }

    /**
     * Calculates the Cosine similarity between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @return {MetricCompute< CosineRaw >} - Object containing the similarity result and raw values
     */
    protected override compute ( a: string, b: string ) : MetricCompute< CosineRaw > {
        const { delimiter = ' ' } = this.options;

        // Compute term frequency vectors
        const termsA = this._termFreq( a, delimiter );
        const termsB = this._termFreq( b, delimiter );

        try {
            // Calculate dot product and magnitudes
            let dotP = 0, magA = 0, magB = 0;

            // Iterate over terms in A for dotProduct and magnitudeA
            for ( const [ term, freqA ] of termsA ) {
                const freqB = termsB.get( term ) || 0;
                dotP += freqA * freqB;
                magA += freqA * freqA;
            }

            // Iterate over terms in B for magnitudeB
            for ( const freqB of termsB.values() ) magB += freqB * freqB;

            magA = Math.sqrt( magA );
            magB = Math.sqrt( magB );

            // Return the result as a MetricCompute object
            return {
                res: ( magA && magB ) ? Metric.clamp( dotP / ( magA * magB ) ) : 0,
                raw: { dotProduct: dotP, magnitudeA: magA, magnitudeB: magB }
            };
        } finally {
            // Release maps back to the pool
            Pool.release( 'map', termsA, termsA.size );
            Pool.release( 'map', termsB, termsB.size );
        }
    }

}

// Register the Cosine similarity in the metric registry
MetricRegistry.add( 'cosine', CosineSimilarity );
