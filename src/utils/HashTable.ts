/**
 * Hash Table Utility
 * src/utils/HashTable.ts
 * 
 * @see https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function
 * @see https://en.wikipedia.org/wiki/Hash_table
 * 
 * This module implements an instantiable hash table/cache using the FNV-1a hash algorithm.
 * It allows for multiple independent caches (e.g. for metrics, normalization, etc.) with
 * type safety and high performance. The FNV-1a algorithm is factored out into its own
 * static utility class to avoid code duplication and memory overhead.
 * 
 * The key() method supports any number of string arguments, enabling flexible cache keys
 * for different use cases (e.g. normalization, metrics, etc.).
 * 
 * @module Utils/HashTable
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * Hasher Utility
 * Static class for FNV-1a hash calculation.
 */
class Hasher {

    // Constants for the FNV-1a hash algorithm
    private static readonly FNV_PRIME: number = 0x01000193;
    private static readonly HASH_OFFSET: number = 0x811c9dc5;

    /**
     * Computes a hash value for a given string using the FNV-1a algorithm.
     * Processes the string in chunks of 4 characters for better performance.
     * 
     * @param {string} str - The string to hash
     * @return {number} - The computed hash value as an unsigned 32-bit integer
     */
    public static fnv1a ( str: string ) : number {

        const len: number = str.length;
        let hash: number = this.HASH_OFFSET;

        // Process 4 characters at a time for better performance
        const chunks: number = Math.floor( len / 4 );

        for ( let i = 0; i < chunks; i++ ) {

            const pos = i * 4;

            // Combine 4 chars into a single number for faster processing
            const chunk: number = (
                ( str.charCodeAt( pos ) ) |
                ( str.charCodeAt( pos + 1 ) <<  8 ) |
                ( str.charCodeAt( pos + 2 ) << 16 ) |
                ( str.charCodeAt( pos + 3 ) << 24 )
            );
            
            hash ^= chunk;
            hash *= this.FNV_PRIME;

        }

        // Handle remaining characters
        const remaining: number = len % 4;

        if ( remaining > 0 ) {

            const pos: number = chunks * 4;

            for ( let i = 0; i < remaining; i++ ) {

                hash ^= str.charCodeAt( pos + i );
                hash *= this.FNV_PRIME;

            }

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
export class HashTable<K extends string, T> {

    // The max. length of a string to hash, which is set to 2048 characters.
    private static readonly MAX_LEN: number = 2048;

    // The max. size of the hash table, which is set to 10,000.
    private static readonly TABLE_SIZE: number = 10_000;

    /**
     * The internal map to store entries.
     * The key is a string generated from the label and any number of hashed strings.
     * The value is of type T.
     */
    private table: Map<string, T> = new Map ();

    /**
     * Generates a unique hash key for any number of string arguments.
     * The key is in the format "label-H1-H2-H3-..."
     *
     * @param {K} label - Label for this key (e.g. metric name, normalization flags, …)
     * @param {string[]} strs - Array of strings to hash (e.g. input, params, …)
     * @param {boolean} [sorted=false] - Whether to sort the hashes before creating the key
     * @returns {string|false} - A unique hash key or false if any string is too long
     */
    public key ( label: K, strs: string[], sorted: boolean = false ) : string | false {

        // Return false if any string exceeds the maximum length
        for ( const str of strs ) {

            if ( str.length > HashTable.MAX_LEN ) return false;

        }

        // Hash all strings
        const hashes: number[] = strs.map( s => Hasher.fnv1a( s ) );

        // Sort them in ascending order
        if ( sorted ) hashes.sort();

        // Build key: label-H1-H2-H3-...
        return [ label, ...hashes ].join( '-' );
    }

    /**
     * Checks if a key exists in the hash table.
     * 
     * @param {string} key - The key to check
     * @returns {boolean} - True if the key exists, false otherwise
     */
    public has ( key: string ) : boolean { return this.table.has( key ) }

    /**
     * Retrieves the entry from the hash table by its key.
     * 
     * @param {string} key - The key to look up
     * @returns {T|undefined} - The entry if found, undefined otherwise
     */
    public get ( key: string ) : T | undefined { return this.table.get( key ) }

    /**
     * Adds an entry to the hash table.
     * 
     * @param {string} key - The hashed key for the entry
     * @param {T} entry - The entry itself to add
     * @param {boolean} [update=true] - Whether to update the entry if it already exists
     * @returns {boolean} - True if added successfully, false if the table is full
     */
    public set ( key: string, entry: T, update: boolean = true ) : boolean {

        // If the table is not full and the key does not exist or update is true, add the entry
        if ( this.table.size < HashTable.TABLE_SIZE && ( update || ! this.table.has( key ) ) ) {

            this.table.set( key, entry );

            return true;

        }

        return false;

    }

    /**
     * Deletes an entry from the hash table by its key.
     * 
     * @param {string} key - The key of the entry to delete
     */
    public delete ( key: string ) : void { this.table.delete( key ) }

    /**
     * Clears the hash table.
     * This method removes all entries from the hash table.
     */
    public clear () : void { this.table.clear() }

    /**
     * Returns the current size of the hash table.
     * 
     * @returns {number} - The number of entries in the hash table
     */
    public size () : number { return this.table.size }

}
