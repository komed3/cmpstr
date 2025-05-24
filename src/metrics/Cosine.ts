/**
 * Cosine Similarity
 * src/metrics/Cosine.ts
 * 
 * Cosine similarity is a measure how similar two vectors are. It's often used
 * in text analysis to compare texts based on the words they contain.
 * 
 * @see https://en.wikipedia.org/wiki/Cosine_similarity
 * 
 * Optimized for performance and batch processing.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 2.0.0
 */

'use strict';

import type { MetricOptions, MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper function to calculate term frequency for a string.
 * 
 * @param {string} str - Input string
 * @param {string} split - Optional string to split string into terms
 * @returns {Record<string, number>} Term frequency object
 */
const _termFreq = (
    str : string,
    split : string
) : Record<string, number> => {

    const freq : Record<string, number> = {};

    for ( const term of str.split( split ) ) {

        freq[ term ] = ( freq[ term ] || 0 ) + 1;

    }

    return freq;

};

/**
 * Helper function to calculate cosine similarity between two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {string} split - Optional string to split string into terms
 * @param {Record<string, number>} termsA - Optional precomputed term frequency for a
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    split : string,
    termsA? : Record<string, number>
) : MetricSingleResult => {

    termsA = termsA || _termFreq( a, split );
    const termsB : Record<string, number> = _termFreq( b, split );

    // Build set of all terms
    const allTerms : Set<string> = new Set ( [
        ...Object.keys( termsA ),
        ...Object.keys( termsB )
    ] );

    // Dot product
    let dotProduct : number = 0;

    for ( const term of allTerms ) {

        dotProduct += ( termsA[ term ] || 0 ) * ( termsB[ term ] || 0 );

    }

    // Magnitudes
    let magnitudeA : number = 0;
    let magnitudeB : number = 0;

    for ( const term of allTerms ) {

        magnitudeA += ( termsA[ term ] || 0 ) ** 2;
        magnitudeB += ( termsB[ term ] || 0 ) ** 2;

    }

    magnitudeA = Math.sqrt( magnitudeA );
    magnitudeB = Math.sqrt( magnitudeB );

    // Calculate normalized string similarity
    const res : number = magnitudeA && magnitudeB
        ? dotProduct / ( magnitudeA * magnitudeB )
        : 0;

    // Return the result
    return {
        metric: 'cosine', a, b, res,
        raw: { dotProduct, magnitudeA, magnitudeB }
    };

};

/**
 * Calculate the Cosine similarity between two strings or a string and an array of strings.
 * 
 * @exports
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @param {string} options.split - Optional string to split string into terms
 * @returns {MetricResult} metric result(s)
 */
export default (
    a : string,
    b : string | string[],
    { split = ' ' } : MetricOptions = {}
) : MetricResult => {

    split = String ( split );

    // Batch mode
    if ( Array.isArray( b ) ) {

        // Precompute term frequency for a (performance)
        const termsA = _termFreq( a, split );

        // Batch comparison
        return b.map( s => _single( a, s, split, termsA ) );

    }

    // Single comparison
    return _single( a, b, split );

};