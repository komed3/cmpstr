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
 * @since 2.0.0
 */

'use strict';

import type { MetricOptions, MetricResult } from '../utils/Types.js';

/**
 * Calculate the Hamming distance (with optional padding).
 * 
 * @param a - First string
 * @param b - Second string
 * @param options.pad - Optional pad shorter string (default: undefined = strict mode)
 * @returns MetricResult
 */
export default (
    a : string,
    b : string,
    { pad = undefined } : MetricOptions
) : MetricResult => {

    let m : number = a.length;
    let n : number = b.length;
    const maxLen : number = Math.max( m, n );

    // Optional: use padding to equalize string length
    if ( pad !== undefined && m !== n ) {

        pad = String ( pad );

        if ( m < maxLen ) a = a.padEnd( maxLen, pad );
        if ( n < maxLen ) b = b.padEnd( maxLen, pad );

        m = n = maxLen;

    }

    // Standard: Error for unequal length
    if ( m !== n ) {

        throw new Error (
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