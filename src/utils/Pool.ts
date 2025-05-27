'use strict';

export class Pool {

    private static bufferA: Uint16Array = new Uint16Array ( 0 );
    private static bufferB: Uint16Array = new Uint16Array ( 0 );

    static get ( len: number ) : [ Uint16Array, Uint16Array ] {

        if ( this.bufferA.length < len ) {

            this.bufferA = new Uint16Array ( len );
            this.bufferB = new Uint16Array ( len );

        }

        return [ this.bufferA, this.bufferB ];

    }

};