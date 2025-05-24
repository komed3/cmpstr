/**
 * Dice-Sørensen Coefficient
 * src/metrics/Dice.ts
 * 
 * The Dice-Sørensen index equals twice the number of elements common to both
 * sets divided by the sum of the number of elements in each set. Typically,
 * bigrams are used for string similarity.
 * 
 * @see https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient
 * 
 * Optimized for performance and batch processing.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 1.0.0
 */

'use strict';

import type { MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper to convert string into set of bigrams.
 * 
 * @param {string} str - Input string
 * @returns {Set<string>} Set of bigrams
 */
const _str2bigrams = (
    str : string
) : Set<string> => {

    const bigrams : Set<string> = new Set ();

    for ( let i = 0; i < str.length - 1; i++ ) {

        bigrams.add( str.substring( i, i + 2 ) );

    }

    return bigrams;

};

/**
 * Helper function to calculate the Dice-Sørensen coefficient between two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {Set<string>} setA - Optional set for first string
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    setA? : Set<string>
) : MetricSingleResult => {

    const m : number = a.length;
    const n : number = b.length;

    let intersection : number = 0;
    let res : number;

    // Check for equal or empty strings
    if ( a === b ) intersection = res = 1;
    else if ( m < 2 || n < 2 ) intersection = res = 0;

    else {

        setA = setA || _str2bigrams( a );
        const setB : Set<string> = _str2bigrams( b );

        // Count the intersection of both sets
        for ( const bigram of setA ) {

            if ( setB.has( bigram ) ) intersection++;

        }

        // Calculate normalized string similarity
        const denom : number = setA.size + setB.size;
        res = denom === 0 ? 1 : ( 2 * intersection ) / denom;

    }

    // Return the result
    return {
        metric: 'dice', a, b, res,
        raw: { intersection }
    };

};

/**
 * Calculate the Dice-Sørensen between two strings or a string and an array of strings.
 * 
 * @exports
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @returns {MetricResult} metric result(s)
 */
export default (
    a : string,
    b : string | string[]
) : MetricResult => {

    // Batch mode
    if ( Array.isArray( b ) ) {

        // Set up the set for the first string (performance optimization)
        const setA : Set<string> = _str2bigrams( a );

        // Batch comparison
        return b.map( s => _single( a, s, setA ) );

    }

    // Single comparison
    return _single( a, b );

};