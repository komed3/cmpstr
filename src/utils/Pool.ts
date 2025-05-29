/**
 * Pool Utility
 * src/utils/Pool.ts
 * 
 * The Pool class provides a simple and efficient buffer pool for dynamic programming
 * algorithms that require temporary arrays (such as Levenshtein, LCS, etc.).
 * By reusing pre-allocated typed arrays, it reduces memory allocations and garbage
 * collection overhead, especially for repeated or batch computations.
 * 
 * @see https://en.wikipedia.org/wiki/Circular_buffer
 * 
 * It supports different types of buffers (Uint16Array, number[], Set, Map) and allows
 * for acquiring buffers of specific sizes while managing a maximum pool size.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PoolType, PoolConfig, PoolBuffer } from './Types';

/**
 * PoolRing is a circular buffer implementation that manages a pool of buffers.
 * 
 * It allows for efficient acquisition and release of buffers, ensuring that
 * buffers are reused without unnecessary allocations.
 * 
 * @template T - The type of buffers managed by the pool
 */
class PoolRing<T> {

    // The buffers in the pool
    private buffers: PoolBuffer<T>[] = [];

    // The current pointer for acquiring buffers
    private pointer: number = 0;

    /**
     * Creates a new PoolRing with a specified maximum size.
     * 
     * @param {number} maxSize - The maximum number of buffers that can be stored in the pool
     */
    constructor (
        private readonly maxSize: number
    ) {}

    /**
     * Acquires a buffer of at least the specified minimum size from the pool.
     * 
     * @param {number} minSize - The minimum size of the buffer to acquire
     * @param {boolean} allowOversize - Whether to allow buffers larger than minSize
     * @return {PoolBuffer<T> | null} - The acquired buffer or null if no suitable buffer is found
     */
    public acquire ( minSize: number, allowOversize: boolean ) : PoolBuffer<T> | null {

        const len: number = this.buffers.length;

        // Iterate through the buffers in the pool
        for ( let i = 0; i < len; i++ ) {

            const idx: number = ( this.pointer + i ) % len;
            const item: PoolBuffer<T> = this.buffers[ idx ];

            // Check if the item size is greater than or equal to the minimum size
            if ( item.size >= minSize ) {

                // Set the pointer to the next position
                this.pointer = ( idx + 1 ) % len;

                // If the item size is equal to minSize or oversize is allowed, return the item
                return allowOversize || item.size === minSize ? item : null;

            }

        }

        // If no suitable buffer is found, return null
        return null;

    }

    /**
     * Releases a buffer back to the pool.
     * If the pool is full, it replaces the oldest buffer with the new one.
     * 
     * @param {PoolBuffer<T>} item - The buffer to release back to the pool
     */
    public release ( item: PoolBuffer<T> ) : void {

        if ( this.buffers.length < this.maxSize ) {

            // If the pool is not full, simply add the item
            this.buffers.push( item );

        } else {

            // If the pool is full, replace the oldest buffer
            this.buffers[ this.pointer ] = item;
            this.pointer = ( this.pointer + 1 ) % this.maxSize;

        }

    }

    /**
     * Clears the pool, removing all buffers.
     * This resets the pointer and empties the buffer list.
     */
    public clear () : void {

        this.buffers = [];
        this.pointer = 0;

    }

}

/**
 * The Pool class provides a buffer pool for dynamic programming algorithms.
 * 
 * It allows for efficient reuse of buffers (Uint16Array, number[], Set, Map)
 * to reduce memory allocations and garbage collection overhead.
 */
export class Pool {

    // Pool Types
    private static readonly CONFIG: Record<PoolType, PoolConfig> = {
        'uint16':   { type: 'uint16',   maxSize: 32, maxItemSize: 2048, allowOversize: true  },
        'number[]': { type: 'number[]', maxSize: 16, maxItemSize: 1024, allowOversize: false },
        'set':      { type: 'set',      maxSize: 8,  maxItemSize: 0,    allowOversize: false },
        'map':      { type: 'map',      maxSize: 8,  maxItemSize: 0,    allowOversize: false },
    };

    // Pool Rings for each type
    private static readonly RINGS: Record<PoolType, PoolRing<any>> = {
        'uint16':   new PoolRing<Uint16Array>( 32 ),
        'number[]': new PoolRing<number[]>( 16 ),
        'set':      new PoolRing<Set<any>>( 8 ),
        'map':      new PoolRing<Map<any, any>>( 8 ),
    };

    /**
     * Allocates a new buffer of the specified type and size.
     * 
     * @private
     * @param {PoolType} type - The type of buffer to allocate
     * @param {number} size - The size of the buffer to allocate
     * @return {any} - The newly allocated buffer
     */
    private static allocate ( type: PoolType, size: number ) : any {

        switch ( type ) {

            case 'uint16':   return new Uint16Array ( size );
            case 'number[]': return new Array ( size ).fill( 0 );
            case 'set':      return new Set ();
            case 'map':      return new Map ();

        }

    }

    /**
     * Acquires a buffer of the specified type and size from the pool.
     * If no suitable buffer is available, it allocates a new one.
     * 
     * @param {PoolType} type - The type of buffer to acquire (e.g., 'uint16', 'number[]', 'set', 'map')
     * @param {number} size - The size of the buffer to acquire
     * @return {T} - The acquired buffer of the specified type
     */
    public static acquire<T = any> ( type: PoolType, size: number ) : T {

        // Get the configuration for the specified type
        const CONFIG: PoolConfig = this.CONFIG[ type ];

        // If the requested size exceeds the maximum item size, allocate a new buffer
        if ( size > CONFIG.maxItemSize ) return this.allocate( type, size );

        // Try to acquire a buffer from the pool ring
        // If a suitable buffer is found, return it (subarray for uint16)
        const item: PoolBuffer<any> | null = this.RINGS[ type ].acquire( size, CONFIG.allowOversize );

        if ( item ) {

            // If the type is 'uint16', return a subarray of the buffer
            return type === 'uint16' ? (
                ( item.buffer as Uint16Array ).subarray( 0, size ) as unknown as T
            ) : item.buffer as T;

        }

        // If no suitable buffer is found, allocate a new one
        return this.allocate( type, size );

    }

    /**
     * Acquires multiple buffers of the specified type and sizes from the pool.
     * 
     * @param {PoolType} type - The type of buffers to acquire
     * @param {number[]} sizes - An array of sizes for each buffer to acquire
     * @return {T[]} - An array of acquired buffers of the specified type
     */
    public static acquireMany<T = any> ( type: PoolType, sizes: number[] ) : T[] {

        return sizes.map( size => this.acquire<T>( type, size ) );

    }

    /**
     * Releases a buffer back to the pool.
     * If the size of the buffer is larger than the maximum item size, it will not be released.
     * 
     * @param {PoolType} type - The type of buffer to release
     * @param {T} buffer - The buffer to release
     * @param {number} size - The size of the buffer
     */
    public static release<T = any> ( type: PoolType, buffer: T, size: number ) : void {

        // Get the configuration for the specified type
        const CONFIG: PoolConfig = this.CONFIG[ type ];

        // If the size of the buffer is less than or equal to the maximum item size, release it
        if ( size <= CONFIG.maxItemSize ) {

            // Release the buffer back to the pool ring
            this.RINGS[ type ].release( { buffer, size } );

        }

    }

}