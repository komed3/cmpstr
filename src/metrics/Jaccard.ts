/**
 * Jaccard Index
 * src/metrics/Jaccard.ts
 * 
 * The Jaccard index (or Jaccard similarity coefficient) is a statistic
 * used for measuring the similarity and diversity of sample sets. It is
 * defined as the size of the intersection divided by the size of the
 * union of two sets.
 * 
 * @see https://en.wikipedia.org/wiki/Jaccard_index
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
 * Helper function to calculate the Jaccard index between two strings.
 * Jaccard index = |A ∩ B| / |A ∪ B|
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {string} split - Optional string to split string into sets
 * @param {Set<string>} setA - Optional set for first string
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    split : string,
    setA? : Set<string>
) : MetricSingleResult => {

    // Set up the sets for both strings
    setA = setA || new Set ( a.split( split ) );
    const setB : Set<string> = new Set ( b.split( split ) );

    // Count the intersection of both sets
    let intersection : number = 0;

    for ( const sub of setA ) {

        if ( setB.has( sub ) ) intersection++;

    }

    // Calculate the union of both sets
    const union : number = setA.size + setB.size - intersection;

    // Calculate normalized string similarity
    const res : number = union === 0 ? 1 : intersection / union;

    // Return the result
    return {
        metric: 'jaccard', a, b, res,
        raw: { intersection, union }
    };

};

/**
 * Calculate the Jaccard index between two strings
 * or a string and an array of strings.
 * 
 * @exports
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @param {string} options.split - Optional string to split string into sets.
 * @returns {MetricResult} metric result(s)
 */
export default (
    a : string,
    b : string | string[],
    { split = '' } : MetricOptions
) : MetricResult => {

    split = String ( split );

    // Batch mode
    if ( Array.isArray( b ) ) {

        // Set up the set for the first string (performance optimization)
        const setA : Set<string> = new Set ( a.split( split ) );

        // Batch comparison
        return b.map( s => _single( a, s, split, setA ) );

    }

    // Single comparison
    return _single( a, b, split );

};