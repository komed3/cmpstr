/**
 * Hash Table
 * src/utils/HashTable.ts
 * 
 * This module implements a hash table using the FNV-1a hash algorithm.
 * 
 * @see https://en.wikipedia.org/wiki/Hash_table
 * @see https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
 * 
 * It provides methods to compute a hash for a given string, generate a unique key
 * for queries, check for the existence of keys, retrieve values, add new entries,
 * clear the table, and get the size of the table. The hash table is designed to
 * store normalized strings and `MetricCompute` objects.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * HashTable class implements a hash table using the FNV-1a hash algorithm.
 */
export class HashTable {

    // Constants for the FNV-1a hash algorithm
    private static readonly FNV_PRIME: number = 0x01000193;
    private static readonly HASH_OFFSET: number = 0x811c9dc5;

    // The max. length of a string to hash, which is set to 2048 characters.
    private static readonly MAX_LEN: number = 2048;

    // The max. size of the hash table, which is set to 10,000.
    private static readonly TABLE_SIZE: number = 10_000;

    /**
     * A static map to store entries.
     * 
     * The key is a string generated from the query and (two) hashed strings,
     * and the value (e.g. normalized strings or a MetricCompute object).
     * 
     * @private
     */
    private static table: Map<string, unknown> = new Map ();

    /**
     * Computes a hash value for a given string using the FNV-1a algorithm.
     * 
     * This method processes the string in chunks of 4 characters for better performance,
     * and handles any remaining characters efficiently.
     * 
     * @private
     * @param {string} str - The string to hash
     * @return {number} - The computed hash value as an unsigned 32-bit integer
     */
    private static fnv1a ( str: string ) : number {

        const len: number = str.length;
        let hash: number = this.HASH_OFFSET;

        // Process 4 characters at a time for better performance
        const chunks: number = Math.floor( len / 4 );

        for ( let i = 0; i < chunks; i++ ) {

            const pos = i * 4;

            // Combine 4 chars into a single number for faster processing
            const chunk = (
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

    /**
     * Generates a unique hash key for a query based on (two) strings.
     * 
     * @param {string} q - The query
     * @param {string} a - The first string to hash
     * @param {string} b - The optional second string to hash
     * @returns {string|false} - A unique hash key in the format "metric-A-B" or false
     */
    public static key ( q: string, a: string, b: string = '' ) : string | false {

        // Return false if either string exceeds the maximum length
        if ( a.length > this.MAX_LEN || b.length > this.MAX_LEN ) return false;

        // Get the hash values for both strings
        const A: number = this.fnv1a( a );
        const B: number = b.length ? this.fnv1a( b ) : 0;

        // Consistent key independent of sequence
        return A < B ? `${q}-${A}-${B}` : `${q}-${B}-${A}`;

    }

    /**
     * Checks if a key exists in the hash table.
     * 
     * @param {string} key - The key to check
     * @returns {boolean} - True if the key exists, false otherwise
     */
    public static has ( key: string ) : boolean {

        return this.table.has( key );

    }

    /**
     * Retrieves the entry from the hash table by its key.
     * 
     * @param {string} key - The key to look up
     * @returns {unknown|undefined} - The entry if found, undefined otherwise
     */
    public static get ( key: string ) : unknown | undefined {

        return this.table.get( key );

    }

    /**
     * Adds an entry (e.g. normalized string or MetricCompute object) to the hash table.
     * 
     * @param {string} key - The hashed key for the entry
     * @param {unknown} entry - The entry itself to add
     * @param {boolean} [update=true] - Whether to update the entry if it already exists
     * @returns {boolean} - True if added successfully, false if the table is full
     */
    public static set ( key: string, entry: unknown, update: boolean = true ) : boolean {

        if ( this.table.size < this.TABLE_SIZE && ( update || ! this.table.has( key ) ) ) {

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
    public static delete ( key: string ) : void {

        this.table.delete( key );

    }

    /**
     * Clears the hash table.
     * 
     * This method removes all entries from the hash table.
     */
    public static clear () : void {

        this.table.clear();

    }

    /**
     * Returns the current size of the hash table.
     * 
     * @returns {number} - The number of entries in the hash table
     */
    public static size () : number {

        return this.table.size;

    }

}