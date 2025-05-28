'use strict';

import type { PoolType, PoolConfig, PoolBuffer } from './Types';

class PoolRing<T> {

    private buffers: PoolBuffer<T>[] = [];
    private pointer: number = 0;

    constructor (
        private readonly maxSize: number
    ) {}

    public acquire ( minSize: number, allowOversize: boolean ) : PoolBuffer<T> | null {

        const len: number = this.buffers.length;

        for ( let i = 0; i < len; i++ ) {

            const idx: number = ( this.pointer + i ) % len;
            const item: PoolBuffer<T> = this.buffers[ idx ];

            if ( item.size >= minSize ) {

                this.pointer = ( idx + 1 ) % len;

                return allowOversize || item.size === minSize ? item : null;

            }

        }

        return null;

    }

    public release ( item: PoolBuffer<T> ) : void {

        if ( this.buffers.length < this.maxSize ) {

            this.buffers.push( item );

        } else {

            this.buffers[ this.pointer ] = item;
            this.pointer = ( this.pointer + 1 ) % this.maxSize;

        }

    }

    clear () : void {

        this.buffers = [];
        this.pointer = 0;

    }

}

export class Pool {

    private static readonly CONFIG: Record<PoolType, PoolConfig> = {
        'uint16':   { type: 'uint16',   maxSize: 32, maxItemSize: 2048, allowOversize: true  },
        'number[]': { type: 'number[]', maxSize: 16, maxItemSize: 1024, allowOversize: false },
        'set':      { type: 'set',      maxSize: 8,  maxItemSize: 0,    allowOversize: false },
        'map':      { type: 'map',      maxSize: 8,  maxItemSize: 0,    allowOversize: false },
    };

    private static readonly RINGS: Record<PoolType, PoolRing<any>> = {
        'uint16':   new PoolRing<Uint16Array>( 32 ),
        'number[]': new PoolRing<number[]>( 16 ),
        'set':      new PoolRing<Set<any>>( 8 ),
        'map':      new PoolRing<Map<any, any>>( 8 ),
    };

    public static acquire<T = any> ( type: PoolType, size: number ) : T {

        const CONFIG: PoolConfig = this.CONFIG[ type ];

        if ( size > CONFIG.maxItemSize ) return this.allocate( type, size );

        const item: PoolBuffer<any> | null = this.RINGS[ type ].acquire( size, CONFIG.allowOversize );

        if ( item ) {

            return type === 'uint16' ? (
                ( item.buffer as Uint16Array ).subarray( 0, size ) as unknown as T
            ) : item.buffer as T;

        }

        return this.allocate( type, size );

    }

    static acquireMany<T = any> ( type: PoolType, sizes: number[] ) : T[] {

        return sizes.map( size => this.acquire<T>( type, size ) );

    }

    static release<T = any> ( type: PoolType, buffer: T, size: number ) : void {

        const CONFIG: PoolConfig = this.CONFIG[ type ];

        if ( size <= CONFIG.maxItemSize ) {

            this.RINGS[ type ].release( { buffer, size } );

        }

    }

    private static allocate ( type: PoolType, size: number ) : any {

        switch ( type ) {

            case 'uint16':   return new Uint16Array ( size );
            case 'number[]': return new Array ( size ).fill( 0 );
            case 'set':      return new Set ();
            case 'map':      return new Map ();

        }

    }

}