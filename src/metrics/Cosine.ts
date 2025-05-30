/**
 * Cosine Similarity
 * src/metrics/Cosine.ts
 * 
 * @see https://en.wikipedia.org/wiki/Cosine_similarity
 * 
 * Cosine similarity is a metric used to measure how similar two vectors are, regardless
 * of their magnitude. In text analysis, it is commonly used to compare documents or
 * strings by representing them as term frequency vectors and computing the cosine of
 * the angle between these vectors. The result is a value between 0 and 1, where 1 means
 * the vectors are identical and 0 means they are orthogonal (no similarity).
 * 
 * This implementation is highly optimized for both time and memory efficiency.
 * It avoids unnecessary allocations by iterating only over the keys present in the
 * term frequency objects, and does not build a union set of all terms.
 * 
 * @module Metric/CosineSimilarity
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

export interface CosineRaw {
    dotProduct: number;
    magnitudeA: number;
    magnitudeB: number;
};

/**
 * CosineSimilarity class extends the Metric class to implement the Cosine similarity algorithm.
 */
export default class CosineSimilarity extends Metric<CosineRaw> {

    /**
     * Constructor for the CosineSimilarity class.
     * 
     * Initializes the Cosine similarity metric with two input strings or
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
        super( 'cosine', a, b, options, true );

    }

    /**
     * Calculates the term frequency vector for a given string.
     * 
     * @param {string} str - The input string
     * @param {string} delimiter - The delimiter to split terms
     * @return {Map<string, number>} - Term frequency object
     */
    private _termFreq ( str: string, delimiter: string ) : Map<string, number> {

        const terms: string[] = str.split( delimiter );
        const freq: Map<string, number> = Pool.acquire( 'map', terms.length );

        for ( const term of terms ) {

            freq.set( term, ( freq.get( term ) || 0 ) + 1 );

        }

        return freq;

    }

    /**
     * Calculates the Cosine similarity between two strings.
     * 
     * This implementation avoids building a union set of all terms and
     * iterates only over the keys present in the term frequency objects.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @return {MetricCompute<CosineRaw>} - Object containing the similarity result and raw values
     */
    override compute ( a: string, b: string ) : MetricCompute<CosineRaw> {

        // Get delimiter from options or use default (space)
        const { delimiter = ' ' } = this.options;

        // Compute term frequency vectors
        const termsA: Map<string, number> = this._termFreq( a, delimiter );
        const termsB: Map<string, number> = this._termFreq( b, delimiter );

        // Calculate dot product and magnitudes
        let dotProduct: number = 0, magnitudeA: number = 0, magnitudeB: number = 0;

        // Iterate over terms in A for dotProduct and magnitudeA
        for ( const [ term, freqA ] of termsA ) {

            const freqB: number = termsB.get( term ) || 0;

            dotProduct += freqA * freqB;
            magnitudeA += freqA * freqA;

        }

        // Iterate over terms in B for magnitudeB
        for ( const freqB of termsB.values() ) {

            magnitudeB += freqB * freqB;

        }

        magnitudeA = Math.sqrt( magnitudeA );
        magnitudeB = Math.sqrt( magnitudeB );

        // Release maps back to the pool
        Pool.release( 'map', termsA, termsA.size );
        Pool.release( 'map', termsB, termsB.size );

        // Return the result as a MetricCompute object
        return {
            res: ( magnitudeA && magnitudeB ) ? Metric.clamp(
                dotProduct / ( magnitudeA * magnitudeB )
            ) : 0,
            raw: { dotProduct, magnitudeA, magnitudeB }
        };

    }

}