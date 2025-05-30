/**
 * Jaccard Index
 * src/metrics/Jaccard.ts
 * 
 * @see https://en.wikipedia.org/wiki/Jaccard_index
 * 
 * The Jaccard Index (or Jaccard similarity coefficient) measures the similarity
 * between two sets by dividing the size of their intersection by the size of
 * their union. In string similarity, it is often used to compare sets of characters,
 * tokens, or n-grams. The result is a value between 0 and 1, where 1 means the
 * sets are identical and 0 means they have no elements in common.
 * 
 * This implementation is optimized for both time and memory efficiency.
 * 
 * @module Metric/JaccardIndex
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

/**
 * JaccardIndex class extends the Metric class to implement the Jaccard Index algorithm.
 */
export default class JaccardIndex extends Metric {

    /**
     * Constructor for the JaccardIndex class.
     * 
     * Initializes the Jaccard Index metric with two input strings or
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
        super( 'jaccard', a, b, options, true );

    }

    /**
     * Calculates the Jaccard Index between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @return {MetricCompute} - Object containing the similarity result and raw values
     */
    override compute ( a: string, b: string, m: number, n: number ) : MetricCompute {

        // Acquire two sets from the Pool
        const setA: Set<string> = Pool.acquire( 'set', m );
        const setB: Set<string> = Pool.acquire( 'set', n );

        // Fill setA and setB with unique characters from a and b
        for ( const A of a ) setA.add( A );
        for ( const B of b ) setB.add( B );

        // Calculate intersection size
        let intersection: number = 0;

        for ( const c of setA ) if ( setB.has( c ) ) intersection++;

        // Calculate union size (setA + elements in setB not in setA)
        let union: number = setA.size;

        for ( const c of setB ) if ( ! setA.has( c ) ) union++;

        // Release sets back to the pool
        Pool.release( 'set', setA, m );
        Pool.release( 'set', setB, n );

        // Return the result as a MetricCompute object
        return {
            res: union === 0 ? 1 : Metric.clamp( intersection / union ),
            raw: { intersection, union }
        };

    }

}