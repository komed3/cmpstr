/**
 * Pool Utility
 * src/utils/Pool.ts
 * 
 * The Pool class provides a simple and efficient buffer pool for dynamic programming
 * algorithms that require temporary arrays (such as Levenshtein, LCS, etc.).
 * By reusing pre-allocated typed arrays, it reduces memory allocations and garbage
 * collection overhead, especially for repeated or batch computations.
 * 
 * The pool maintains a fixed number of buffers, each with a certain length and
 * a timestamp for LRU (least recently used) replacement. For very large arrays,
 * the pool is bypassed and a fresh buffer is allocated.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 3.0.0
 */

'use strict';

import type { PoolBuffer } from './Types';

/**
 * Pool class for efficient reuse of temporary buffers.
 */
export class Pool {

    // Maximum number of buffers to keep in the pool
    private static readonly POOL_SIZE = 8;

    // Maximum length of buffer to pool (larger arrays are not pooled)
    private static readonly MAX_LEN = 100000;

    // The actual pool of buffers
    private static buffers: PoolBuffer[] = [];

    /**
     * Get the current timestamp (ms).
     * Uses performance.now() if available, otherwise Date.now().
     * 
     * @private
     * @returns {number} - High-resolution timestamp
     */
    private static _now () : number {

        return typeof performance !== 'undefined' ? performance.now() : Date.now();

    }

    /**
     * Create a new buffer object with two Uint16Arrays of the given length.
     * 
     * @private
     * @param {number} len - Length of the arrays
     * @param {number} t - Timestamp for LRU management
     * @returns {PoolBuffer} - PoolBuffer object
     */
    private static _create ( len: number, t: number ) : PoolBuffer {

        return {
            a: new Uint16Array ( len ),
            b: new Uint16Array ( len ),
            len, t
        };

    }

    /**
     * Clear the buffer pool and frees all pooled buffers.
     */
    public static clear () : void {

        this.buffers = [];

    }

    /**
     * Get a pair of reusable Uint16Array buffers of the requested length.
     * If a suitable buffer is not available, a new one is created and added to the pool.
     * For very large arrays, pooling is bypassed for performance reasons.
     * 
     * @param {number} len - Required length of the arrays
     * @returns {[Uint16Array, Uint16Array]} [a, b] - Two Uint16Array buffers
     */
    public static get ( len: number ) : [ Uint16Array, Uint16Array ] {

        // For very large arrays, do not use the pool
        if ( len > this.MAX_LEN ) {

            return [
                new Uint16Array ( len ),
                new Uint16Array ( len )
            ];

        }

        const t: number = this._now();

        // Try to find a reusable buffer with sufficient length
        let reusable = this.buffers.find( b => b.len >= len );

        if ( ! reusable ) {

            // No suitable buffer found, create a new one
            reusable = this._create( len, t );

            if ( this.buffers.length < this.POOL_SIZE ) {

                // Add to pool if space is available
                this.buffers.push( reusable );

            } else {

                // Replace the least recently used buffer
                this.buffers[ this.buffers.indexOf( this.buffers.reduce(
                    ( acc, val ) => val.t < acc.t ? val : acc
                ) ) ] = reusable;

            }

        }

        // Update timestamp for LRU management
        reusable.t = t;

        // Return subarrays of the correct length (in case buffer is longer)
        return [
            reusable.a.subarray( 0, len ),
            reusable.b.subarray( 0, len )
        ];

    }

};