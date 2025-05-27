'use strict';

import type { PoolBuffer } from './Types';

export class Pool {

    private static readonly POOL_SIZE = 8;
    private static readonly MAX_LEN = 100000;

    private static buffers: PoolBuffer[] = [];

    private static _now () : number {

        return typeof performance !== 'undefined' ? performance.now() : Date.now();

    }

    private static _create ( len: number, t: number ) {

        return {
            a: new Uint16Array ( len ),
            b: new Uint16Array ( len ),
            len, t
        };

    }

    public static clear () : void {

        this.buffers = [];

    }

    public static get ( len: number ) : [ Uint16Array, Uint16Array ] {

        if ( len > this.MAX_LEN ) {

            return [
                new Uint16Array ( len ),
                new Uint16Array ( len )
            ];

        }

        const t: number = this._now();

        let reusable = this.buffers.find( b => b.len >= len );

        if ( ! reusable ) {

            reusable = this._create( len, t );

            if ( this.buffers.length < this.POOL_SIZE ) {

                this.buffers.push( reusable );

            } else {

                this.buffers[ this.buffers.indexOf( this.buffers.reduce(
                    ( acc, val ) => val.t < acc.t ? val : acc
                ) ) ] = reusable;

            }

        }

        reusable.t = t;

        return [
            reusable.a.subarray( 0, len ),
            reusable.b.subarray( 0, len )
        ];

    }

};