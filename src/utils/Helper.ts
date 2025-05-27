/**
 * Helper Utility
 * src/utils/Helper.ts
 * 
 * The Helper class provides static utility functions used throughout the
 * CmpStr package. The implementation ensures compatibility with both
 * Node.js and browser environments, always preferring the highest
 * available resolution.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 3.0.0
 */

'use strict';

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

};