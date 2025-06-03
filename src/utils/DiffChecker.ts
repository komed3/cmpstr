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
            contextLines: 1,
            groupedLines: true,
            showChangeMagnitude: true,
            maxMagnitudeSymbols: 5,
            lineBreak: '\n'
        }, ...options };

        this.computeDiff();

    }

    private splitLines ( input: string ) : string[] {

        return input.trim().split( /\r?\n/ );

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

            const linesA: string[] = this.splitLines( this.a );
            const linesB: string[] = this.splitLines( this.b );
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

            if ( A !== B ) {

                diffs.push( {
                    posA: 0, posB: 0,
                    del: a, ins: b,
                    size: b.length - a.length
                } );

                delSize = a.length;
                insSize = b.length;

            }

        } else {

            diffs = this.preciseDiff( a, A, b, B );

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

    private preciseDiff ( a: string, A: string, b: string, B: string ) : DiffEntry[] {

        const posIndex = ( t: string[] ) => t.reduce(
            ( p, _, i ) => ( p.push( i ? p[ i - 1 ] + t[ i - 1 ].length + 1 : 0 ), p ),
            [] as number[]
        );

        const origA: string[] = this.tokenize( a );
        const origB: string[] = this.tokenize( b );
        const tokenA: string[] = this.tokenize( A );
        const tokenB: string[] = this.tokenize( B );
        const lenA: number = tokenA.length;
        const lenB: number = tokenB.length;
        const posArrA = posIndex( origA );
        const posArrB = posIndex( origB );

        const diffs: DiffEntry[] = [];
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

        i = 0, j = 0;

        for ( const m of matches ) {

            if ( i < m.ai || j < m.bi ) {

                const delArr: string[] = origA.slice( i, m.ai );
                const insArr: string[] = origB.slice( j, m.bi );

                diffs.push( {
                    posA: posArrA[ i ] ?? 0,
                    posB: posArrB[ j ] ?? 0,
                    del: this.concat( delArr ),
                    ins: this.concat( insArr ),
                    size: insArr.join( '' ).length - delArr.join( '' ).length
                } );

            }

            i = m.ai + m.len, j = m.bi + m.len;

        }

        if ( i < lenA || j < lenB ) {

            const delArr: string[] = origA.slice( i );
            const insArr: string[] = origB.slice( j );

            diffs.push( {
                posA: posArrA[ i ] ?? 0,
                posB: posArrB[ j ] ?? 0,
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

    private output ( cli: boolean ) : string {

        const { mode, contextLines, groupedLines, showChangeMagnitude, lineBreak } = this.options;

        const highlight = ( s: string, ansi: string ) => cli ? `\x1b[${ansi}m${s}\x1b[0m` : s;

        const cy = ( s: string ) => highlight( s, '36' );
        const gy = ( s: string ) => highlight( s, '90' );
        const gn = ( s: string ) => highlight( s, '32' );
        const rd = ( s: string ) => highlight( s, '31' );
        const ye = ( s: string ) => highlight( s, '33' );

        const del = ( s: string ) => cli ? `\x1b[37;41m${s}\x1b[0m` : `[-${s}]`;
        const ins = ( s: string ) => cli ? `\x1b[37;42m${s}\x1b[0m` : `[+${s}]`;

        const mark = ( line: string, diffs: DiffEntry[], type: 'del' | 'ins' ) : string => {

            if ( ! diffs.length || mode === 'line' ) return line;

            let res: string = '', idx: number = 0;

            for ( const d of diffs ) {

                const pos: number = type === 'del' ? d.posA : d.posB;
                const val: string = type === 'del' ? d.del : d.ins;

                if ( ! val ) continue;

                if ( pos > idx ) res += line.slice( idx, pos );

                res += ( type === 'del' ? del( val ) : ins( val ) );
                idx = pos + val.length;

            }

            return res + line.slice( idx );

        };

        const linesA: string[] = this.splitLines( this.a );
        const linesB: string[] = this.splitLines( this.b );

        let out: string[] = [ '' ];

        for ( const e of this.entries ) {

            out.push( `       ${ cy( `@@ -${ ( e.line + 1 ) },${e.delSize} +${( e.line + 1 ) },${e.insSize} @@` ) } ${ (
                showChangeMagnitude ? ye( e.magnitude ) : ''
            ) }` );

            for ( let i = e.line - contextLines; i <= e.line + contextLines; i++ ) {

                if ( linesA[ i ] || linesB[ i ] ) {

                    const lineNo: string = ( i + 1 ).toString().padStart( 4, ' ' );

                    if ( i === e.line ) {

                        out.push( `${lineNo} ${ rd( `- ${ mark( linesA[ i ], e.diffs, 'del' ) }` ) }` );
                        out.push( `     ${ gn( `+ ${ mark( linesB[ i ], e.diffs, 'ins' ) }` ) }` );

                    } else {

                        out.push( `${lineNo}   ${ gy( linesA[ i ] ) }` );

                    }

                }

            }

            out.push( '' );

        }

        return out.join( lineBreak );

    }

    public getStructuredDiff () : DiffGroup[] {

        return this.entries;

    }

    public getASCIIDiff () : string {

        return this.output( false );

    }

    public getCLIDiff () : string {

        return this.output( true );

    }

}