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
 * @author Paul Köhler (komed3)
 * @license MIT
 * @since 2.0.0
 */

'use strict';

import type { MetricOptions, MetricResult } from '../utils/Types.js';

/**
 * Calculate the Jaccard index between two strings.
 * Jaccard index = |A ∩ B| / |A ∪ B|
 * 
 * @param a - First string
 * @param b - Second string
 * @param options.split - Optional string to split string into sets.
 * @returns MetricResult.
 */
export default (
    a : string,
    b : string,
    { split = '' } : MetricOptions
) : MetricResult => {

    // Set up the sets for both strings
    const setA : Set<string> = new Set ( a.split( split ) );
    const setB : Set<string> = new Set ( b.split( split ) );

    // Count the intersection of both sets
    let intersection : number = 0;

    for ( const char of setA ) {

        if ( setB.has( char ) ) intersection++;

    }

    // Calculate the union of both sets
    const union : number = setA.size + setB.size - intersection;

    // Calculate normalized string similarity
    const res : number = union === 0 ? 1 : intersection / union;

    return {
        metric: 'jaccard',
        a, b,
        raw: intersection,
        res
    };

};