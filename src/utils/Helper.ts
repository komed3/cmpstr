/**
 * Helper Utility
 * src/utils/Helper.ts
 * 
 * This utility class provides various helper methods for string comparison
 * metrics. It includes methods for calculating timestamps, string lengths,
 * normalized similarity, converting inputs to arrays and checking input types
 * for single or batch operations.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 3.0.0
 */

'use strict';

import type { MetricInput } from './Types';

/**
 * Helper class with static utility methods.
 */
export class Helper {

    /**
     * Returns a high-resolution timestamp in milliseconds.
     * Uses performance.now() if available (sub-millisecond precision
     * in browsers and Node.js >= 8.5), otherwise falls back to
     * Date.now() (millisecond precision).
     * 
     * @returns {number} - High-resolution timestamp in milliseconds
     */
    public static now () : number {

        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now() : Date.now();

    }

    /**
     * Returns the lengths of two strings and the maximum length of them.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {{ m: number, n: number, maxLen: number }} - String lengths
     */
    public static mnLen ( a: string, b: string ) : {
        m: number, n: number,
        maxLen: number
    } {

        const m: number = a.length, n: number = b.length;

        return { m, n, maxLen: Math.max( m, n ) };

    }

    /**
     * Swaps two strings and their lengths if the first is longer than the second.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @returns {[string, string, number, number]} - Swapped strings and lengths
     */
    public static swap ( a: string, b: string, m: number, n: number ) : [
        string, string, number, number
    ] {

        return m > n ? [ b, a, n, m ] : [ a, b, m, n ];

    }

    /**
     * Calculates the normalized similarity based on the raw and maximum value.
     * 
     * @param {number} raw - Raw value (e.g., distance)
     * @param {number} max - Maximum value (e.g., maximum possible distance)
     * @returns {number} - Normalized similarity (0 to 1)
     */
    public static similarity ( raw: number, max: number ) : number {

        return max === 0 ? 1 : 1 - raw / max;

    }

    /**
     * Converts a MetricInput to an array of strings.
     * If the input is already an array, it returns it as is.
     * If it's a single string, it wraps it in an array.
     * 
     * @param {MetricInput} s - Input to convert
     * @returns {string[]} - Array of strings
     */
    public static asArr ( s: MetricInput ) : string[] {

        return Array.isArray( s ) ? s : [ s ];

    }

    /**
     * Checks if the inputs are suitable for single operations.
     * 
     * @param {MetricInput} a - First input
     * @param {MetricInput} b - Second input
     * @returns {boolean} - True if both inputs are strings, false otherwise
     */
    public static singleOp ( a: MetricInput, b: MetricInput ) : boolean {

        return typeof a === 'string' && typeof b === 'string';

    }

    /**
     * Checks if the inputs are suitable for batch operations.
     * 
     * @param {MetricInput} a - First input
     * @param {MetricInput} b - Second input
     * @returns {boolean} - True if either input is an array, false otherwise
     */
    public static batchOp ( a: MetricInput, b: MetricInput ) : boolean {

        return Array.isArray( a ) || Array.isArray( b );

    }

};