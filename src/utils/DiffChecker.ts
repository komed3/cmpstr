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
            maxMagnitudeSymbols: 5,
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

            const { len, ins, del } = this.lineDiff( aLine, bLine );
            const insLen: number = ins.length;
            const delLen: number = del.length;

            if ( insLen > 0 || delLen > 0 ) {

                this.entries.push( {
                    line: i + 1,
                    ins: this.concat( ins ),
                    del: this.concat( del ),
                    insLen, delLen,
                    magnitude: this.buildMagnitude( insLen, delLen, len )
                } );

            }

        }

        this.diffRun = true;

    }

    private lineDiff ( a: string[], b: string[] ) : {
        len: number; ins: string[]; del: string[];
    } {

        const ins: string[] = [], del: string[] = [];
        const len = Math.max( a.length, b.length );

        for ( let i = 0; i < len; i++ ) {

            const x:string = a[ i ], y: string = b[ i ];

            if ( x !== y ) {

                if ( x ) del.push( x );
                if ( y ) ins.push( y );

            }

        }

        return { len, ins, del };

    }

    private buildMagnitude ( ins: number, del: number, baseLen: number ) : string {

        const total: number = ins + del;

        if ( total === 0 || baseLen === 0 ) return '';

        const magSize: number = Math.min(
            this.options.maxMagnitudeSymbols,
            Math.max( 1, Math.round(
                total / baseLen * this.options.maxMagnitudeSymbols
            ) )
        );

        const pCount: number = Math.round( ( ins / total ) * magSize );
        const mCount: number = magSize - pCount;

        return '+'.repeat( pCount ) + '-'.repeat( mCount );

    }

    public getStructuredDiff () : DiffEntry[] {

        return this.entries;

    }

}
