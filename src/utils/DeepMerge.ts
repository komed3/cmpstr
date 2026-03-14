/**
 * Deep Merge Utility
 * src/utils/DeepMerge.ts
 * 
 * This module provides the utility class `DeepMerge` for deep merging objects and
 * manipulating nested properties using path strings. It allows you to get, set,
 * check, and delete values at deeply nested paths within an object, as well as
 * merge two objects together while preserving their structure.
 * 
 * It supports dot and bracket notation (e.g. `a.b[0].c`) as well as escaped keys.
 * 
 * @module Utils
 * @name DeepMerge
 * @author Paul Köhler
 * @license MIT
 */

'use strict';

import { ErrorUtil } from './Errors';


/**
 * DeepMerge class provides static methods for deep merging objects and
 * manipulating nested properties using path strings.
 */
export class DeepMerge {

    /** Regular expression to match bracket notation in paths */
    private static readonly BRACKET_PATTERN = /\[(\d+)]/g;
    /** Path cach for efficient parsing */
    private static readonly PATH_CACHE: Map< string, ( string | number )[] > = new Map();

    /**
     * Walk through an object using an array of keys and return
     * whether the path exists and its value.
     * 
     * @param {any} obj - The object to walk through
     * @param {( string | number )[]} keys - An array of keys representing the path to walk
     * @returns {{ exists: false } | { exists: true, value: any }} -
     *      An object indicating whether the path exists and its value if it does
     */
    private static walk ( obj: any, keys: ( string | number )[] ) : { exists: false } | { exists: true, value: any } {
        let o = obj;

        for ( let i = 0; i < keys.length; i++ ) {
            const k = keys[ i ];
            if ( o == null || !( k in o ) ) return { exists: false };
            o = o[ k ];
        }

        return { exists: true, value: o };
    }


    /**
     * Parse a path string into an array of keys.
     * 
     * @param {string} p - The path string, e.g. `a.b.c` or `a[0].b`
     * @returns {( string | number )[]} - An array of keys, e.g. `['a', 'b', 'c']` or `['a', 0, 'b']`
     */
    public static parse ( p: string ) : ( string | number )[] {
        const cached = DeepMerge.PATH_CACHE.get( p );
        if ( cached ) return cached;

        const parsed = p.replace( DeepMerge.BRACKET_PATTERN, '.$1' ).split( '.' ).map( s => {
            const n = Number( s ); return Number.isInteger( n ) && String( n ) === s ? n : s;
        } );

        // Prevent cache from growing indefinitely by clearing it when it exceeds 2000 entries
        if ( DeepMerge.PATH_CACHE.size > 2000 ) DeepMerge.PATH_CACHE.clear();

        DeepMerge.PATH_CACHE.set( p, parsed );
        return parsed;
    }

    /**
     * Check if a path exists in an object.
     * 
     * @template T - The type of the object to get the value from
     * @param {T} t - The object to check
     * @param {string} path - The path string, e.g. `a.b.c`
     * @returns {boolean} - True if the path exists, otherwise false
     */
    public static has< T extends Record< string, any > > ( t: T, path: string ) : boolean {
        return DeepMerge.walk( t, DeepMerge.parse( path ) ).exists;
    }

    /**
     * Deeply get a value from an object by a path string.
     * 
     * @template T - The type of the object to get the value from
     * @template R - The return type of the value
     * @param {T} t - The object to get the value from
     * @param {string} path - The path string, e.g. `a.b.c`
     * @param {any} fb - The default value to return if the path does not exist
     * @returns {R | undefined} - The value at the specified path, otherwise the default value
     */
    public static get< T extends Record< string, any >, R = any > ( t: T, path: string, fb?: R ) : R | undefined {
        const r = DeepMerge.walk( t, DeepMerge.parse( path ) );
        return r.exists ? r.value : fb;
    }

    /**
     * Deeply set a value in an object by a path string.
     * 
     * @template T - The type of the object to get the value from
     * @param {T} t - The object to set the value in
     * @param {string} path - The path string, e.g. `a.b.c`
     * @param {any} value - The value to set at the specified path
     * @returns {T} - The modified object with the value set at the specified path
     * @throws {CmpStrUsageError} - If the path is invalid or if a non-object value is encountered along the path
     */
    public static set< T extends Record< string, any > > ( t: T, path: string, value: any ) : T {
        if ( path === '' ) return value as T;
        const keys: ( string | number )[] = DeepMerge.parse( path );

        // Throw an error if the root object is not valid
        ErrorUtil.assert( t === undefined || ( typeof t === 'object' && t !== null ),
            `Cannot set property <${ keys[ 0 ] }> of <${ JSON.stringify( t ) }>`,
            { path: keys[ 0 ], target: t }
        );

        // Initialize the root object
        const root = ( t ?? ( typeof keys[ 0 ] === 'number' ? [] : Object.create( null ) ) ) as T;
        let cur: any = root;

        // Iterate through the keys and create nested objects/arrays as needed
        for ( let i = 0; i < keys.length - 1; i++ ) {
            const k = keys[ i ]; let n = cur[ k ];

            // Throw an error if the current value is not an object
            ErrorUtil.assert( n == null || typeof n === 'object',
                `Cannot set property <${ keys[ i + 1 ] }> of <${ JSON.stringify( n ) }>`,
                { path: keys.slice( 0, i + 2 ), value: n }
            );

            // Create a new object or array if the next key does not exist
            if ( n == null ) n = cur[ k ] = typeof keys[ i + 1 ] === 'number' ? [] : Object.create( null );

            cur = n;
        }

        // Set the final value at the last key
        cur[ keys[ keys.length - 1 ] ] = value;
        return root;
    }

    /**
     * Delete a value at a specified path in an object.
     * 
     * @template T - The type of the object to get the value from
     * @param {T} t - The object to delete the value from
     * @param {string} path - The path string, e.g. `a.b.c`
     * @param {boolean} [preserveEmpty=false] - Whether to preserve empty objects/arrays
     * @returns {T} - The modified object with the value deleted at the specified path
     */
    public static rmv< T extends Record< string, any > > ( t: T, path: string, preserveEmpty: boolean = false ) : T {
        const keys: ( string | number )[] = DeepMerge.parse( path );

        // Recursive function to remove the key at the specified path
        const remove = ( obj?: any, i = 0 ) : boolean => {
            const key = keys[ i ];

            // Delete the key if it is not an object or if it is the last key in the path
            if ( ! obj || typeof obj !== 'object' ) return false;
            if ( i === keys.length - 1 ) return delete obj[ key ];
            if ( ! remove( obj[ key ], i + 1 ) ) return false;

            // If preserveEmpty is false, check if the object or array is empty
            if ( ! preserveEmpty ) {
                const val = obj[ key ];

                // If the value is an empty array or object, delete the key
                if ( typeof val === 'object' && (
                    ( Array.isArray( val ) && val.every( v => v == null ) ) ||
                    ( ! Array.isArray( val ) && Object.keys( val ).length === 0 )
                ) ) delete obj[ key ];
            }

            return true;
        };

        remove( t );
        return t;
    }

    /**
     * Deeply merge two objects, where the second object overrides the first.
     * 
     * @template T - The type of the object to get the value from
     * @param {T} t - The target object to merge into
     * @param {T} o - The source object to merge from
     * @param {boolean} [mergeUndefined=false] - Whether to merge undefined values
     * @returns {T} - The merged object
     */
    public static merge< T extends Record< string, any > > (
        t: T | undefined = Object.create( null ),
        o: T | undefined = Object.create( null ),
        mergeUndefined: boolean = false
    ) : T {
        const target: T = t ?? Object.create( null );

        for ( const k in o ) {
            const val = o[ k ];

            // Skip undefined values if mergeUndefined is false
            if ( ! mergeUndefined && val === undefined ) continue;

            // Prevent prototype pollution
            if ( k === '__proto__' || k === 'constructor' ) continue;

            // If val is an object (but not array), merge recursively
            if ( val !== null && typeof val === 'object' && ! Array.isArray( val ) ) {
                const existing = target[ k ];

                target[ k ] = DeepMerge.merge(
                    existing !== null && typeof existing === 'object' && ! Array.isArray( existing )
                        ? existing : Object.create( null ),
                    val,
                    mergeUndefined
                );
            }

            else target[ k ] = val;
        }

        return target;
    }

}
