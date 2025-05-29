/**
 * Helper Utility
 * src/utils/Helper.ts
 * 
 * This utility class provides various helper methods.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * Helper class with static utility methods.
 */
export class Helper {

    /**
     * Swaps two strings and their lengths if the first is longer than the second.
     * 
     * @static
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
     * Converts an input to an array of strings.
     * If the input is already an array, it returns it as is.
     * If the input is a single value (string or number), it wraps it in an array.
     * 
     * @static
     * @param {any} s - Input to convert
     * @returns {string[]} - Array of strings
     */
    public static asArr ( s: any ) : string[] {

        return Array.isArray( s ) ? s : [ s ];

    }

};