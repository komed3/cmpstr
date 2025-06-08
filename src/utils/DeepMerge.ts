'use strict';

export function get<T extends Record<string, any>, R = any> (
    t: T, path: string, def?: any
) : T | R | undefined {

    return path.split( '.' ).reduce( ( o, k ) => (
        o?.[ k ] !== undefined ? o[ k ] : def
    ), t );

}

export function set<T extends Record<string, any>> (
    t: T, path: string, value: any
) : T {

    if ( path === '' ) return value;

    const [ k, next ] = path.split( { [ Symbol.split ]( s ) {
        const i = s.indexOf( '.' ); return i == -1 ? [ s, '' ] : [
            s.slice( 0, i ), s.slice( i + 1 )
        ];
    } } );

    if ( t !== undefined && t instanceof Object ) throw Error (
        `cannot set property ${k} of ${ JSON.stringify( t ) }`
    );

    return Object.assign( t ?? (
        /^\d+$/.test( k ) ? [] : Object.create( null )
    ), { [ k ]: set( t?.[ k ], next, value ) } ) as T;

}

export function merge<T extends Record<string, any>> (
    t: T | undefined, obj: T | undefined
) : T {

    ( obj as any ) ||= Object.create( null ), ( t as any ) ||= Object.create( null );

    return Object.keys( obj! ).forEach(
        ( k ) => ( t as any )[ k ] = obj![ k ] && typeof obj![ k ] === 'object'
            ? merge( ( t as any )[ k ], obj![ k ] ) : obj![ k ]
    ), t ?? {} as T;

}