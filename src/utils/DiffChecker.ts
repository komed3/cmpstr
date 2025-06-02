'use strict';

import type { DiffOptions, DiffEntry } from './Types';
import { Normalizer } from './Normalizer';

export class DiffChecker {

    private readonly a: string;
    private readonly b: string;
    private readonly options: Required<DiffOptions>;

    private entries: DiffEntry[] = [];
    private diffRun: boolean = false;

    constructor ( a: string, b: string, options: DiffOptions = {} ) {

        this.options = { ...{
            mode: 'word',
            ignoreWhitespace: false,
            ignoreCase: false,
            normalizeFlags: '',
            contextLines: 2,
            showChangeMagnitude: true,
            compact: true
        }, ...options };

        this.a = this.normalize( a );
        this.b = this.normalize( b );

        this.computeDiff();

    }

    private normalize( text: string ) : string {

        return Normalizer.normalize( text, this.options.normalizeFlags );

    }

    private tokenize ( text: string ) : string[][] {

        const token: string[][] = [];

        for ( const line of text.split( /\r?\n/ ) ) {

            switch ( this.options.mode ) {

                case 'line': token.push( [ line.trim() ] ); break;

                case 'word': token.push( line.trim().split( /\s+/ ) ); break;

                case 'char': token.push( line.split( '' ) ); break;

            }

        }

        return token;

    }

    private concat ( token: string[] ) : string {

        switch ( this.options.mode ) {

            case 'line': // Same as word
            case 'word': return token.join( ' ' );

            case 'char': return token.join( '' );

        }

    }

    private computeDiff () : void {

        const aLines: string[][] = this.tokenize( this.a );
        const bLines: string[][] = this.tokenize( this.b );
        const maxLen: number = Math.max( aLines.length, bLines.length );

        for ( let i = 0; i < maxLen; i++ ) {

            const aLine: string[] = aLines[ i ] || [];
            const bLine: string[] = bLines[ i ] || [];

            const { add, del } = this.lineDiff( aLine, bLine );
            const addLen: number = add.length;
            const delLen: number = del.length;

            if ( addLen > 0 || delLen > 0 ) {

                this.entries.push( {
                    line: i + 1,
                    add: this.concat( add ),
                    del: this.concat( del ),
                    addLen, delLen,
                    magnitude: this.calcMagnitude( addLen + delLen )
                } );

            }

        }

        this.diffRun = true;

    }

    private lineDiff ( a: string[], b: string[] ) : { add: string[], del: string[]; } {

        const add: string[] = [], del: string[] = [];
        const len = Math.max( a.length, b.length );

        for ( let i = 0; i < len; i++ ) {

            const x:string = a[ i ], y: string = b[ i ];

            if ( x !== y ) {

                if ( x ) del.push( x );
                if ( y ) add.push( y );

            }

        }

        return { add, del };

    }

    private calcMagnitude ( size: number ) : string {

        return '';

    }

    public getStructuredDiff () : DiffEntry[] {

        return this.entries;

    }

}
