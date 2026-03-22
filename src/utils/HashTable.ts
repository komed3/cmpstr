/**
 * Hash Table Utility
 * src/utils/HashTable.ts
 * 
 * @see https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function
 * @see https://en.wikipedia.org/wiki/MurmurHash
 * @see https://en.wikipedia.org/wiki/Hash_table
 * 
 * This module implements an instantiable hash table/cache using a modified FNV-1a hash
 * algorithm, optimized for speed and low collision rates.
 * 
 * It allows for multiple independent caches (e.g. for metrics, normalization, etc.) with
 * type safety and high performance.
 * 
 * The key() method supports any number of string arguments, enabling flexible cache keys
 * for different use cases (e.g. normalization, metrics, etc.).
 * 
 * @module Utils
 * @name HashTable
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * Hasher Utility
 * Static class for modified FNV-1a hash algorithm implementation.
 */
export class Hasher {

    /** Constants for the hash algorithm */
    private static readonly FNV_PRIME: number = 0x01000193;
    private static readonly HASH_OFFSET: number = 0x811c9dc5;

    /**
     * Computes a hash value for a given string using the FNV-1a algorithm.
     * 
     * Modifications:
     * - Processes 4 characters at a time (chunks)
     * - Using MurmurHash3 finalizer
     * 
     * @param {string} str - The string to hash
     * @return {number} - The computed hash value as an unsigned 32-bit integer
     */
    public static fastFNV1a ( str: string ) : number {
        const len = str.length;
        const limit = len & ~3;
        let hash = this.HASH_OFFSET;
        let i = 0;

        // Process 4 characters at a time for better performance
        for ( ; i < limit; i += 4 ) {
            const chunk = str.charCodeAt( i ) |
                ( str.charCodeAt( i + 1 ) << 8 ) |
                ( str.charCodeAt( i + 2 ) << 16 ) |
                ( str.charCodeAt( i + 3 ) << 24 );

            hash ^= chunk;
            hash = Math.imul( hash, this.FNV_PRIME );
        }

        // Process remaining characters
        for ( ; i < len; i++ ) {
            hash ^= str.charCodeAt( i );
            hash = Math.imul( hash, this.FNV_PRIME );
        }

        // Final mixing to improve distribution
        hash ^= hash >>> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >>> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >>> 16;

        // Convert to unsigned 32-bit integer
        return hash >>> 0;
    }

}

/**
 * HashTable class implements an instantiable hash table/cache.
 * Allows for multiple independent caches with type safety and high performance.
 * 
 * @template K - The type of the label for the key (e.g. string, MetricName, …)
 * @template T - The type of value to be stored in the hash table (e.g. MetricCompute, string, …)
 */
export class HashTable< K extends string, T > {

    /** The max. length of a string to hash, which is set to 2048 characters */
    private static readonly MAX_LEN: number = 2048;

    /**
     * The internal map to store entries.
     * The key is a string generated from the label and any number of hashed strings.
     * The value is of type T.
     */
    private table = new Map< string, T > ();

    /**
     * Creates an instance of HashTable.
     * 
     * @param {boolean} [FIFO=true] - Whether to use FIFO eviction (true) when the table is full
     * @param {number} [maxSize=10000] - The maximum number of entries in the hash table
     */
    constructor (
        private readonly FIFO: boolean = true,
        private readonly maxSize = 10000
    ) {}

    /**
     * Generates a unique hash key for any number of string arguments.
     * Return false if any string exceeds the maximum length.
     * The key is in the format "label-H1-H2-H3-..."
     *
     * @param {K} label - Label for this key (e.g. metric name, normalization flags, …)
     * @param {string[]} strs - Array of strings to hash (e.g. input, params, …)
     * @param {boolean} [sorted=false] - Whether to sort the hashes before creating the key
     * @returns {string | false} - A unique hash key or false if any string is too long
     */
    public key ( label: K, strs: string[], sorted: boolean = false ) : string | false {
        const n = strs.length;
        const hashes: number[] = new Array( n );

        // Hash each string and check length
        for ( let i = 0; i < n; i++ ) {
            const s = strs[ i ];
            if ( s.length > HashTable.MAX_LEN ) return false;
            hashes[ i ] = Hasher.fastFNV1a( s );
        }

        // Optionally sort the hashes to create a consistent key regardless of input order
        if ( sorted ) hashes.sort( ( a, b ) => a - b );

        // Create the final key by concatenating the label and the hashes
        let key: string = label;
        for ( let i = 0; i < hashes.length; i++ ) key += '-' + hashes[ i ];

        return key;
    }

    /**
     * Checks if a key exists in the hash table.
     * 
     * @param {string} key - The key to check
     * @returns {boolean} - True if the key exists, false otherwise
     */
    public has ( key: string ) : boolean {
        return this.table.has( key );
    }

    /**
     * Retrieves the entry from the hash table by its key.
     * 
     * @param {string} key - The key to look up
     * @returns {T | undefined} - The entry if found, undefined otherwise
     */
    public get ( key: string ) : T | undefined {
        return this.table.get( key );
    }

    /**
     * Adds an entry to the hash table.
     * If the table is full, it evicts the least recently used entry
     * (if FIFO is enabled) or returns false.
     * 
     * @param {string} key - The hashed key for the entry
     * @param {T} entry - The entry itself to add
     * @param {boolean} [update=true] - Whether to update the entry if it already exists
     * @returns {boolean} - True if added successfully, false if the table is full
     */
    public set ( key: string, entry: T, update: boolean = true ) : boolean {
        if ( ! update && this.table.has( key ) ) return false;

        // Evict least recently used entry if table is full
        if ( ! this.table.has( key ) && this.table.size >= this.maxSize ) {
            if ( ! this.FIFO ) return false;
            this.table.delete( this.table.keys().next().value! );
        }

        this.table.set( key, entry );
        return true;
    }

    /**
     * Deletes an entry from the hash table by its key.
     * 
     * @param {string} key - The key of the entry to delete
     * @returns {boolean} - True if the entry was deleted, false if the key was not found
     */
    public delete ( key: string ) : boolean {
        return this.table.delete( key );
    }

    /**
     * Clears the hash table.
     * This method removes all entries from the hash table.
     */
    public clear () : void {
        this.table.clear();
    }

    /**
     * Returns the current size of the hash table.
     * 
     * @returns {number} - The number of entries in the hash table
     */
    public size () : number {
        return this.table.size;
    }

}
