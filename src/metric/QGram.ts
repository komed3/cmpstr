/**
 * q-Gram Similarity
 * src/metric/QGram.ts
 * 
 * @see https://en.wikipedia.org/wiki/Q-gram
 * 
 * Q-gram similarity is a string-matching algorithm that compares two strings by
 * breaking them into substrings (q-grams) of length Q. The similarity is computed
 * as the size of the intersection of q-gram sets divided by the size of the larger
 * set.
 * 
 * This metric is widely used in approximate string matching, information retrieval,
 * and computational linguistics.
 * 
 * @module Metric
 * @name QGramSimilarity
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';


import type { Buffer, MetricCompute, MetricInput, MetricOptions } from '../utils/Types';

import { Pool } from '../utils/Pool';
import { Metric, MetricRegistry } from './Metric';

export interface QGramRaw {
  intersection: number;
  size: number;
}


/**
 * QGramSimilarity class extends the Metric class to implement the q-Gram similarity algorithm.
 */
export class QGramSimilarity extends Metric< QGramRaw > {

  /**
   * Constructor for the QGramSimilarity class.
   * 
   * Initializes the q-Gram similarity metric with two input strings or
   * arrays of strings and optional options.
   * 
   * Metric is symmetrical.
   * 
   * @param {MetricInput} a - First input string or array of strings
   * @param {MetricInput} b - Second input string or array of strings
   * @param {MetricOptions} [opt] - Options for the metric computation
   */
  public constructor ( a: MetricInput, b: MetricInput, opt: MetricOptions = {} ) {
    super( 'qGram', a, b, opt, true );
  }

  /**
   * Converts a string into a set of q-grams (substrings of length q).
   * 
   * @param {string} str - The input string
   * @param {number} q - The length of each q-gram
   * @return {Set< string >} - Set of q-grams
   */
  private qGrams ( str: string, q: number ) : Buffer< Set< string > > {
    const len = Math.max( 0, str.length - q + 1 );
    const grams = Pool.acquire< Set< string > >( 'set', len );

    for ( let i = 0; i < len; i++ ) grams.buffer.add( str.slice( i, i + q ) );
    return grams;
  }

  /**
   * Calculates the q-Gram similarity between two strings.
   * 
   * @param {string} a - First string
   * @param {string} b - Second string
   * @return {MetricCompute< QGramRaw >} - Object containing the similarity result and raw values
   */
  protected override compute ( a: string, b: string ) : MetricCompute< QGramRaw > {
    // Get q from options or use default "2"
    const { q = 2 } = this.options;

    // Generate q-gram sets for both strings
    const setAWrapped = this.qGrams( a, q ), setBWrapped = this.qGrams( b, q );
    const [ { buffer: setA }, { buffer: setB } ] = [ setAWrapped, setBWrapped ];
    const sizeA = setA.size, sizeB = setB.size;

    try {
      // Calculate intersection size
      let intersection: number = 0;
      for ( const gram of setA ) if ( setB.has( gram ) ) intersection++;

      // Calculate the size of the larger set
      const size: number = Math.max( sizeA, sizeB );

      // Return the result as a MetricCompute object
      return {
        res: size === 0 ? 1 : Metric.clamp( intersection / size ),
        raw: { intersection, size }
      };
    } finally {
      // Release sets back to the pool
      Pool.release( 'set', setAWrapped );
      Pool.release( 'set', setBWrapped );
    }
  }

  /**
   * Calculates raw result from pre-computed trivial res
   * 
   * @param {MetricCompute< QGramRaw >} result - The result of the metric pre-computation
   * @param {number} maxLen - Maximum length of the strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {MetricCompute< QGramRaw >} - The result of the metric computation with raw
   */
  protected override getRawFromPreComputedRes ( result: MetricCompute< QGramRaw >, maxLen: number, a: string, b: string ) : MetricCompute< QGramRaw > {
    void maxLen;
    if (result.raw) return result;
    let intersection = 0, size = 0;
    const { q = 2 } = this.options;
    const setAWrapped = this.qGrams( a, q );
    const { buffer: setA } = setAWrapped;
    if (result.res === 1) {
      intersection = result.res * setA.size;
      size = setA.size;
    } else if (result.res === 0) {
      const setBWrapped = this.qGrams( b, q );
      const { buffer: setB } = setBWrapped;
      size = Math.max( setA.size, setB.size );
      Pool.release( 'set', setBWrapped );
    }
    Pool.release( 'set', setAWrapped );
    return {
      ...result,
      raw: { intersection, size }
    };
  }
}


// Register the q-Gram similariry in the metric registry
MetricRegistry.add( 'qGram', QGramSimilarity );
