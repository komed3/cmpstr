/**
 * Deep Merge Utility
 * src/utils/DeepMerge.ts
 * 
 * This module provides utility functions for deep merging objects, getting values by path,
 * and setting values by path in a deeply nested object structure.
 * 
 * It supports dot and bracket notation (e.g. `a.b[0].c`) as well as escaped keys.
 * 
 * Included functions:
 *  - `get`:   Retrieve a deeply nested value by path
 *  - `set`:   Assign a value to a nested path
 *  - `merge`: Deeply merge two objects
 *  - `has`:   Check whether a path exists
 *  - `rmv`:   Delete a value at a path
 * 
 * @module Utils/DeepMerge
 * @author Paul Köhler
 * @license MIT
 */

'use strict';

/** Regular expression to match bracket notation in paths */
const BRACKET_PATTERN = /\[(\d+)]/g;
/** Path cach for efficient parsing */
const PATH_CACHE: Map< string, ( string | number )[] > = new Map();

/**
 * Parse a path string into an array of keys.
 * 
 * @param {string} p - The path string, e.g. `a.b.c` or `a[0].b`
 * @returns {( string | number )[]} - An array of keys, e.g. `['a', 'b', 'c']` or `['a', 0, 'b']`
 */
function parse ( p: string ) : ( string | number )[] {
    let cached = PATH_CACHE.get( p );
    if ( cached ) return cached;

    const parsed = p.replace( BRACKET_PATTERN, '.$1' ).split( '.' ).map( s => {
        const n = Number( s ); return Number.isInteger( n ) && String( n ) === s ? n : s;
    } );

    PATH_CACHE.set( p, parsed );
    return parsed;
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
export function get< T extends Record< string, any >, R = any > ( t: T, path: string, fb?: R ) : R | undefined {
    let o: any = t;

    for ( const k of parse( path ) ) {
        if ( o == null || ! ( k in o ) ) return fb;
        o = o[ k ];
    }

    return o;
}

/**
 * Check if a path exists in an object.
 * 
 * @template T - The type of the object to get the value from
 * @param {T} t - The object to check
 * @param {string} path - The path string, e.g. `a.b.c`
 * @returns {boolean} - True if the path exists, otherwise false
 */
export function has< T extends Record< string, any > > ( t: T, path: string ) : boolean {
    let o: any = t;

    for ( const k of parse( path ) ) {
        if ( o == null || ! ( k in o ) ) return false;
        o = o[ k ];
    }

    return true;
}

/**
 * Deeply set a value in an object by a path string.
 * 
 * @template T - The type of the object to get the value from
 * @param {T} t - The object to set the value in
 * @param {string} path - The path string, e.g. `a.b.c`
 * @param {any} value - The value to set at the specified path
 * @returns {T} - The modified object with the value set at the specified path
 * @throws {Error} - Throws an error if the key is not a valid identifier
 */
export function set< T extends Record< string, any > > ( t: T, path: string, value: any ) : T {
    if ( path === '' ) return value as T;
    const keys: ( string | number )[] = parse( path );

    // Throw an error if the root object is not valid
    if ( t !== undefined && ( typeof t !== 'object' || t === null ) ) throw Error (
        `Cannot set property <${ keys[ 0 ] }> of <${ JSON.stringify( t ) }>`
    );

    // Initialize the root object
    const root = ( t ?? ( typeof keys[ 0 ] === 'number' ? [] : Object.create( null ) ) ) as T;
    let cur: any = root;

    // Iterate through the keys and create nested objects/arrays as needed
    for ( let i = 0; i < keys.length - 1; i++ ) {
        const k = keys[ i ]; let n = cur[ k ];

        // Throw an error if the current value is not an object
        if ( n != null && ( typeof n !== 'object' ) ) throw Error (
            `Cannot set property <${ keys[ i + 1 ] }> of <${ JSON.stringify( n ) }>`
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
 * Deeply merge two objects, where the second object overrides the first.
 * 
 * @template T - The type of the object to get the value from
 * @param {T} t - The target object to merge into
 * @param {T} o - The source object to merge from
 * @param {boolean} [mergeUndefined=false] - Whether to merge undefined values
 * @returns {T} - The merged object
 */
export function merge< T extends Record< string, any > > (
    t: T | undefined = Object.create( null ),
    o: T | undefined = Object.create( null ),
    mergeUndefined: boolean = false
) : T {
    const target: T = t ?? Object.create( null );

    // Iterate over the keys of the source object and merge them into the target object
    Object.keys( o ).forEach( k => {
        const val = o[ k ];

        // Skip undefined values if mergeUndefined is false
        if ( ! mergeUndefined && val === undefined ) return;

        // Prevent prototype pollution
        if ( k === '__proto__' || k === 'constructor' ) return;

        // If val is an object (but not array), merge recursively
        if ( val !== null && typeof val === 'object' && ! Array.isArray( val ) ) {
            const existing = target[ k ];
            ( target as any )[ k ] = merge(
                existing !== null && typeof existing === 'object' && ! Array.isArray( existing )
                    ? existing as Record< string, any >
                    : Object.create( null ),
                val as Record< string, any >,
                mergeUndefined
            );
        }

        // Primitive or array → replace
        else ( target as any )[ k ] = val;
    } );

    return target;
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
export function rmv< T extends Record< string, any > > ( t: T, path: string, preserveEmpty: boolean = false ) : T {
    const keys: ( string | number )[] = parse( path );

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
