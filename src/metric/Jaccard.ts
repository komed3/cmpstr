/**
 * Jaccard Index
 * src/metric/Jaccard.ts
 * 
 * @see https://en.wikipedia.org/wiki/Jaccard_index
 * 
 * The Jaccard Index (or Jaccard similarity coefficient) measures the similarity
 * between two sets by dividing the size of their intersection by the size of
 * their union. In string similarity, it is often used to compare sets of characters,
 * tokens, or n-grams. The result is a value between 0 and 1, where 1 means the
 * sets are identical and 0 means they have no elements in common.
 * 
 * @module Metric/JaccardIndex
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute } from '../utils/Types';

import { Pool } from '../utils/Pool';
import { Metric, MetricRegistry } from './Metric';

export interface JaccardRaw {
    intersection: number;
    union: number;
}

/**
 * JaccardIndex class extends the Metric class to implement the Jaccard Index algorithm.
 */
export class JaccardIndex extends Metric< JaccardRaw > {

    /**
     * Constructor for the JaccardIndex class.
     * 
     * Initializes the Jaccard Index metric with two input strings or
     * arrays of strings and optional options.
     * 
     * Metric is symmetrical.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} [opt] - Options for the metric computation
     */
    constructor ( a: MetricInput, b: MetricInput, opt: MetricOptions = {} ) {
        super ( 'jaccard', a, b, opt, true );
    }

    /**
     * Calculates the Jaccard Index between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @return {MetricCompute< JaccardRaw >} - Object containing the similarity result and raw values
     */
    protected override compute ( a: string, b: string, m: number, n: number ) : MetricCompute< JaccardRaw > {
        // Acquire two sets from the Pool
        const [ setA, setB ] = Pool.acquireMany< Set< string > >( 'set', [ m, n ] );

        try {
            // Fill setA and setB with unique characters from a and b
            for ( const A of a ) setA.add( A );
            for ( const B of b ) setB.add( B );

            // Calculate intersection size
            let intersection = 0;
            for ( const c of setA ) if ( setB.has( c ) ) intersection++;

            // Calculate union size (setA + elements in setB not in setA)
            const union = setA.size + setB.size - intersection;

            // Return the result as a MetricCompute object
            return {
                res: union === 0 ? 1 : Metric.clamp( intersection / union ),
                raw: { intersection, union }
            };
        } finally {
            // Release sets back to the pool
            Pool.release( 'set', setA, m );
            Pool.release( 'set', setB, n );
        }
    }

}

// Register the Jaccard index in the metric registry
MetricRegistry.add( 'jaccard', JaccardIndex );
