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

/**
 * Parse a path string into an array of keys.
 * 
 * @param {string} p - The path string, e.g. `a.b.c` or `a[0].b`
 * @returns {(string|number)[]} - An array of keys, e.g. `['a', 'b', 'c']` or `['a', 0, 'b']`
 */
const parse = ( p: string ) : ( string | number )[] => (
    p.replace( /\[(\d+)]/g, '.$1' ).split( '.' ).map( s => /^\d+$/.test( s ) ? +s : s )
);

/**
 * Deeply get a value from an object by a path string.
 * 
 * @template T - The type of the object to get the value from
 * @param {T} t - The object to get the value from
 * @param {string} path - The path string, e.g. `a.b.c`
 * @param {any} fallback - The default value to return if the path does not exist
 * @returns {T|R|undefined} - The value at the specified path, otherwise the default value
 */
export function get<T extends Record<string, any>, R = any> (
    t: T, path: string, fallback?: any
) : T | R | undefined {

    return parse( path ).reduce( ( o, k ) => o?.[ k ] ?? fallback, t );

}

/**
 * Check if a path exists in an object.
 * 
 * @template T - The type of the object to get the value from
 * @param {T} t - The object to check
 * @param {string} path - The path string, e.g. `a.b.c`
 * @returns {boolean} - True if the path exists, otherwise false
 */
export function has<T extends Record<string, any>> ( t: T, path: string ) : boolean {

    return parse( path ).reduce(
        ( o, k ) => o && k in o ? o[ k ] : undefined, t
    ) !== undefined;

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
export function set<T extends Record<string, any>> (
    t: T, path: string, value: any
) : T {

    // If the path is empty, return the value
    if ( path === '' ) return value;

    // Split the path into the first key and the rest of the path
    const [ k, ...r ]: ( string | number )[] = parse( path );

    // Throw an error if the key is not a valid identifier
    if ( t !== undefined && ( typeof t !== 'object' || t === null ) ) throw Error (
        `cannot set property <${k}> of <${ JSON.stringify( t ) }>`
    );

    // Assign the value to the specified key in the object
    return Object.assign( t ?? ( typeof k === 'number' ? [] : Object.create( null ) ), {
        [ k ]: set( t?.[ k ], r.join( '.' ), value )
    } ) as T;

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
export function merge<T extends Record<string, any>> (
    t: T | undefined = Object.create( null ),
    o: T | undefined = Object.create( null ),
    mergeUndefined: boolean = false
) : T {

    // Iterate over the keys of the source object and merge them into the target object
    return Object.keys( o ).forEach( k => {

        const val = o[ k ];

        // If the value is undefined and mergeUndefined is false, skip it
        if ( ! mergeUndefined && val === undefined ) return ;

        // Skip dangerous property names to prevent prototype pollution
        if ( k === '__proto__' || k === 'constructor' ) return ;

        // If the value is an object and not an array, recursively merge it
        ( t as any )[ k ] = typeof val === 'object' && ! Array.isArray( val )
            ? merge(typeof t[ k ] === 'object' && ! Array.isArray( t[ k ] )
                ? t[ k ] : Object.create( null ), val )
            : val;

    } ), t;

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
export function rmv<T extends Record<string, any>> (
    t: T, path: string, preserveEmpty: boolean = false
) : T {

    const r = ( o: any, k: ( string | number )[], i = 0 ) : boolean => {

        const key: string | number = k[ i ];

        // Delete the key if it is not an object or if it is the last key in the path
        if ( ! o || typeof o !== 'object' ) return false;
        if ( i === k.length - 1 ) return delete o[ key ];
        if ( ! r( o[ key ], k, i + 1 ) ) return false;

        // If preserveEmpty is false, check if the object or array is empty
        if ( ! preserveEmpty ) {

            const val: any = o[ key ];

            // If the value is an empty array or object, delete the key
            if ( typeof val === 'object' && (
                ( Array.isArray( val ) && val.every( v => v == null ) ) ||
                ( ! Array.isArray( val ) && Object.keys( val ).length === 0 )
            ) ) delete o[ key ];

        }

        return true;

    };

    r( t, parse( path ) );

    return t;

}