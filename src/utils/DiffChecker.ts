'use strict';

import type { DiffOptions, DiffGroup, DiffEntry } from './Types';

export class DiffChecker {

    private readonly a: string;
    private readonly b: string;
    private readonly options: Required<DiffOptions>;

    private entries: DiffGroup[] = [];
    private diffRun: boolean = false;

    constructor ( a: string, b: string, options: DiffOptions = {} ) {

        this.a = a, this.b = b;

        this.options = { ...{
            mode: 'word',
            caseInsensitive: false,
            contextLines: 2,
            showChangeMagnitude: true,
            maxMagnitudeSymbols: 5
        }, ...options };

        this.computeDiff();

    }

    private tokenize ( input: string ) : string[] {

        const { mode } = this.options;

        switch ( mode ) {

            case 'line': return [ input ];
            case 'word': return input.split( /\s+/ );
            case 'char': return [ ...input ];

        }

    }

    private concat ( input: string[] ) : string {

        const { mode } = this.options;

        return input.join( mode === 'word' ? ' ' : '' );

    }

    private computeDiff () : void {

        if ( ! this.diffRun ) {

            const linesA: string[] = this.a.split( /\r?\n/ );
            const linesB: string[] = this.b.split( /\r?\n/ );
            const maxLen: number = Math.max( linesA.length, linesB.length );

            for ( let i = 0; i < maxLen; i++ ) {

                const a: string = linesA[ i ] || '';
                const b: string = linesB[ i ] || '';

                this.lineDiff( a, b, i );

            }

            this.diffRun = true;

        }

    }

    private lineDiff ( a: string, b: string, line: number ) : void {

        const { mode, caseInsensitive } = this.options;

        const baseLen = Math.max( a.length, b.length );
        let A: string = a, B: string = b;

        if ( caseInsensitive ) A = a.toLowerCase(), B = b.toLowerCase();

        let diffs: DiffEntry[] = [];
        let delSize: number = 0, insSize: number = 0;

        if ( mode === 'line' ) {

            if ( a !== b ) {

                diffs.push( {
                    posA: 0, posB: 0,
                    del: a, ins: b,
                    size: b.length - a.length
                } );

                delSize = a.length;
                insSize = b.length;

            }

        } else {

            diffs = this.preciseDiff( A, B );

            delSize = diffs.reduce( ( s, d ) => s + d.del.length, 0 );
            insSize = diffs.reduce( ( s, d ) => s + d.ins.length, 0 );

        }

        if ( diffs.length ) {

            this.entries.push( {
                line, diffs, delSize, insSize, baseLen,
                totalSize: insSize - delSize,
                magnitude: this.magnitude( insSize, delSize, baseLen )
            } );

        }

    }

    private preciseDiff ( a: string, b: string ) : DiffEntry[] {

        const { mode } = this.options;

        const tokenA: string[] = this.tokenize( a );
        const tokenB: string[] = this.tokenize( b );
        const lenA: number = tokenA.length, lenB: number = tokenB.length;

        const diffs: DiffEntry[] = [];
        let posA: number = 0, posB: number = 0;
        let i: number = 0, j: number = 0;

        const matches: Array<{ ai: number, bi: number, len: number }> = [];
        let ai: number = 0, bi: number = 0;

        while ( ai < lenA && bi < lenB ) {

            if ( tokenA[ ai ] === tokenB[ bi ] ) {

                let len: number = 1;

                while (
                    ai + len < lenA && bi + len < lenB &&
                    tokenA[ ai + len ] === tokenB[ bi + len ]
                ) len++;

                matches.push( { ai, bi, len } );
                ai += len, bi += len;

            } else {

                let found: boolean = false;

                for ( let offset = 1; offset <= 3 && ! found; offset++ ) {

                    if ( ai + offset < lenA && tokenA[ ai + offset ] === tokenB[ bi ] ) {

                        matches.push( { ai: ai + offset, bi, len: 1 } );
                        ai += offset + 1, bi += 1, found = true;

                    }

                    else if ( bi + offset < lenB && tokenA[ ai ] === tokenB[ bi + offset ] ) {

                        matches.push( { ai, bi: bi + offset, len: 1 } );
                        ai += 1, bi += offset + 1, found = true;

                    }

                }

                if ( ! found ) ai++, bi++;

            }

        }

        i = 0; j = 0; posA = 0; posB = 0;

        for ( const m of matches ) {

            if ( i < m.ai || j < m.bi ) {

                const delArr: string[] = tokenA.slice( i, m.ai );
                const insArr: string[] = tokenB.slice( j, m.bi );

                diffs.push( {
                    posA, posB,
                    del: this.concat( delArr ),
                    ins: this.concat( insArr ),
                    size: insArr.join( '' ).length - delArr.join( '' ).length
                } );

                posA += delArr.reduce( ( s, t ) => s + t.length, 0 );
                posB += insArr.reduce( ( s, t ) => s + t.length, 0 );

            }

            posA += tokenA.slice( m.ai, m.ai + m.len ).reduce( ( s, t ) => s + t.length, 0 );
            posB += tokenB.slice( m.bi, m.bi + m.len ).reduce( ( s, t ) => s + t.length, 0 );
            i = m.ai + m.len, j = m.bi + m.len;

        }

        if ( i < lenA || j < lenB ) {

            const delArr: string[] = tokenA.slice( i );
            const insArr: string[] = tokenB.slice( j );

            diffs.push( {
                posA, posB,
                del: this.concat( delArr ),
                ins: this.concat( insArr ),
                size: insArr.join( '' ).length - delArr.join( '' ).length
            } );

        }

        return diffs.filter( d => d.del.length > 0 || d.ins.length > 0 );

    }

    private magnitude ( ins: number, del: number, baseLen: number ) : string {

        const { maxMagnitudeSymbols } = this.options;

        const total: number = ins + del;

        if ( total === 0 || baseLen === 0 ) return '';

        const magLen: number = Math.min( maxMagnitudeSymbols, Math.max(
            Math.round( total / baseLen * maxMagnitudeSymbols ), 1
        ) );

        const plus: number = Math.round( ( ins / total ) * magLen );
        const minus: number = magLen - plus;

        return '+'.repeat( plus ) + '-'.repeat( minus );

    }

    public getStructuredDiff () : DiffGroup[] {

        return this.entries;

    }

}