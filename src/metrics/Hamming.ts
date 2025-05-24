/**
 * Hamming Distance
 * src/metrics/Hamming.ts
 * 
 * The Hamming distance is a metric for comparing two strings of equal length.
 * It measures the number of positions at which the corresponding symbols are
 * different. This implementation allows for optional padding of the shorter
 * string to equalize lengths, otherwise it throws an error if the strings are
 * of unequal length.
 * 
 * @see https://en.wikipedia.org/wiki/Hamming_distance
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 2.0.0
 */

'use strict';

import type { MetricOptions, MetricResult, MetricSingleResult } from '../utils/Types.js';

/**
 * Helper function to calculate the Hamming distance between two strings.
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {string} pad - Optional pad shorter string (default: undefined = strict mode)
 * @returns {MetricSingleResult} metric result
 */
const _single = (
    a : string,
    b : string,
    pad : string | undefined
) : MetricSingleResult => {

    let m : number = a.length;
    let n : number = b.length;
    const maxLen : number = Math.max( m, n );

    // Check for equal string length
    if ( m !== n ) {

        // Optional: use padding to equalize string length
        if ( pad !== undefined ) {

            pad = String ( pad ).substring( 0, 1 );

            if ( m < maxLen ) a = a.padEnd( maxLen, pad );
            if ( n < maxLen ) b = b.padEnd( maxLen, pad );

            m = n = maxLen;

        }

        // Standard: Error for unequal length
        else throw new Error (
            `Strings must be of equal length for Hamming Distance, a=${m} and b=${n} given`
        );

    }

    // Calculate the Hamming distance
    let dist : number = 0;

    for ( let i = 0; i < a.length; i++ ) {

        if ( a[ i ] !== b[ i ] ) dist++;

    }

    // Calculate normalized string similarity
    const res : number = a.length === 0 ? 1 : 1 - dist / a.length;

    // Return the result
    return {
        metric: 'hamming', a, b, res,
        raw: { dist }
    };

};

/**
 * Calculate the Hamming distance between two strings or a string and an array of strings.
 * 
 * @exports
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @param {string} options.pad - Optional pad shorter string (default: undefined = strict mode)
 * @returns {MetricResult} metric result(s)
 */
export default (
    a : string,
    b : string | string[],
    { pad = undefined } : MetricOptions = {}
) : MetricResult => {

    // Batch mode
    if ( Array.isArray( b ) ) {

        // Batch comparison
        return b.map( s => _single( a, s, pad ) );

    }

    // Single comparison
    return _single( a, b, pad );

};