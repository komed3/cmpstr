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
 * @author Paul Köhler (komed3)
 * @license MIT
 * @since 1.0.0
 */

'use strict';

import type { MetricResult } from '../utils/Types.js';

/**
 * Helper to convert string into set of bigrams.
 * 
 * @param str - Input string
 * @returns Set of bigrams
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
 * Calculate the Dice-Sørensen coefficient between two strings.
 * 
 * @param a - First string
 * @param b - Second string
 * @returns MetricResult
 */
export default (
    a : string,
    b : string
) : MetricResult => {

    const m : number = a.length;
    const n : number = b.length;

    let intersection : number = 0;
    let res : number;

    // Special case of empty strings
    if ( m < 2 && n < 2 ) intersection = res = 1;
    else if ( m < 2 || n < 2 ) intersection = res = 0;

    else {

        const setA : Set<string> = _str2bigrams( a );
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