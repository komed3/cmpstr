/**
 * Deep Merge Utility
 * src/utils/DeepMerge.ts
 * 
 * This module provides utility functions for deep merging objects, getting values by path,
 * and setting values by path in a deeply nested object structure.
 * 
 * It includes functions to:
 *   - `get`: Deeply retrieve a value from an object by a path string.
 *   - `set`: Deeply set a value in an object by a path string.
 *   - `merge`: Deeply merge two objects, where the second object overrides the first.
 * 
 * @module Utils/DeepMerge
 * @author Paul Köhler
 * @license MIT
 */

'use strict';

/**
 * Deeply get a value from an object by a path string.
 * 
 * @param {T} t - The object to get the value from
 * @param {string} path - The path string, e.g. `a.b.c`
 * @param {any} def - The default value to return if the path does not exist
 * @returns {T|R|undefined} - The value at the specified path, otherwise the default value
 */
export function get<T extends Record<string, any>, R = any> (
    t: T, path: string, def?: any
) : T | R | undefined {

    return path.split( '.' ).reduce( ( o, k ) => (
        o?.[ k ] !== undefined ? o[ k ] : def
    ), t );

}

/**
 * Deeply set a value in an object by a path string.
 * 
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
    const [ k, next ] = path.split( { [ Symbol.split ]( s ) {
        const i = s.indexOf( '.' ); return i == -1 ? [ s, '' ] : [
            s.slice( 0, i ), s.slice( i + 1 )
        ];
    } } );

    // Throw an error if the key is not a valid identifier
    if ( t !== undefined && t instanceof Object ) throw Error (
        `cannot set property ${k} of ${ JSON.stringify( t ) }`
    );

    // Assign the value to the specified key in the object
    return Object.assign( t ?? (
        /^\d+$/.test( k ) ? [] : Object.create( null )
    ), { [ k ]: set( t?.[ k ], next, value ) } ) as T;

}

/**
 * Deeply merge two objects, where the second object overrides the first.
 * 
 * @param {T} t - The target object to merge into
 * @param {T} obj - The source object to merge from
 * @returns {T} - The merged object
 */
export function merge<T extends Record<string, any>> (
    t: T | undefined, obj: T | undefined
) : T {

    // If either object is undefined, create an empty object
    ( obj as any ) ||= Object.create( null ), ( t as any ) ||= Object.create( null );

    // Iterate over the keys of the source object and merge them into the target object
    return Object.keys( obj! ).forEach(
        ( k ) => ( t as any )[ k ] = obj![ k ] && typeof obj![ k ] === 'object'
            ? merge( ( t as any )[ k ], obj![ k ] ) : obj![ k ]
    ), t ?? {} as T;

}