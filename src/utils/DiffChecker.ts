'use strict';

import type { DiffOptions, DiffLine, DiffEntry, DiffGroup } from './Types';

export class DiffChecker {

    private readonly a: string;
    private readonly b: string;
    private readonly options: Required<DiffOptions>;

    private entries: DiffLine[] = [];
    private grouped: DiffGroup[] = [];
    private diffRun: boolean = false;

    constructor ( a: string, b: string, options: DiffOptions = {} ) {

        this.a = a, this.b = b;

        this.options = { ...{
            mode: 'word',
            caseInsensitive: false,
            contextLines: 1,
            groupedLines: true,
            expandLines: false,
            showChangeMagnitude: true,
            maxMagnitudeSymbols: 5,
            lineBreak: '\n'
        }, ...options };

        this.computeDiff();

    }

    private text2lines () : { linesA: string[], linesB: string[], maxLen: number; } {

        const linesA: string[] = this.a.trim().split( /\r?\n/ );
        const linesB: string[] = this.b.trim().split( /\r?\n/ );

        return { linesA, linesB, maxLen: Math.max( linesA.length, linesB.length ) };

    }

    private tokenize ( input: string ) : string[] {

        const { mode } = this.options;

        switch ( mode ) {

            case 'line': return [ input ];
            case 'word': return input.split( /\s+/ );

        }

    }

    private concat ( input: string[] ) : string {

        const { mode } = this.options;

        return input.join( mode === 'word' ? ' ' : '' );

    }

    private computeDiff () : void {

        if ( ! this.diffRun ) {

            const { linesA, linesB, maxLen } = this.text2lines();

            for ( let i = 0; i < maxLen; i++ ) {

                const a: string = linesA[ i ] || '';
                const b: string = linesB[ i ] || '';

                this.lineDiff( a, b, i );

            }

            this.findGroups();

            this.diffRun = true;

        }

    }

    private lineDiff ( a: string, b: string, line: number ) : void {

        const { mode, caseInsensitive } = this.options;

        const baseLen: number = Math.max( a.length, b.length );
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

            for ( const d of diffs ) delSize += d.del.length, insSize += d.ins.length;

        }

        if ( diffs.length ) {

            this.entries.push( {
                line, diffs, delSize, insSize, baseLen,
                totalSize: insSize - delSize,
                magnitude: this.magnitude( delSize, insSize, baseLen )
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
        const posArrA: number[] = posIndex( origA );
        const posArrB: number[] = posIndex( origB );

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

        const diffs: DiffEntry[] = [];
        let i: number = 0, j: number = 0;

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

    private findGroups () : void {

        const { contextLines } = this.options;

        const addGroup = ( group: DiffLine[], start: number, end: number ) : void => {

            const [ delSize, insSize, totalSize, baseLen ] = [
                'delSize', 'insSize', 'totalSize', 'baseLen'
            ].map( k => group.reduce(
                ( sum, e ) => sum + ( e as any )[ k ], 0
            ) );

            this.grouped.push( {
                start, end, delSize, insSize, totalSize,
                line: group[ 0 ].line, entries: group,
                magnitude: this.magnitude( delSize, insSize, baseLen )
            } );

        };

        let group: DiffLine[] = [];
        let start: number = 0, end: number = 0;

        for ( const entry of this.entries ) {

            const s: number = Math.max( 0, entry.line - contextLines );
            const e: number = entry.line + contextLines;

            if ( ! group.length || s <= end + 1 ) {

                if ( ! group.length ) start = s;

                end = Math.max( end, e );
                group.push( entry );

            } else {

                addGroup( group, start, end );

                group = [ entry ], start = s, end = e;

            }

        }

        if ( group.length ) addGroup( group, start, end );

    }

    private magnitude ( del: number, ins: number, baseLen: number ) : string {

        const { maxMagnitudeSymbols } = this.options;

        const total: number = del + ins;

        if ( total === 0 || baseLen === 0 ) return '';

        const magLen: number = Math.min( maxMagnitudeSymbols, Math.max(
            Math.round( total / baseLen * maxMagnitudeSymbols ), 1
        ) );

        const plus: number = Math.round( ( ins / total ) * magLen );
        const minus: number = magLen - plus;

        return '+'.repeat( plus ) + '-'.repeat( minus );

    }

    private output ( cli: boolean ) : string {

        const { mode, contextLines, groupedLines, expandLines, showChangeMagnitude, lineBreak } = this.options;

        const { linesA, linesB, maxLen } = this.text2lines();
        const linePad: number = Math.max( 4, maxLen.toString().length );

        const highlight = ( s: string, ansi: string ) : string => cli ? `\x1b[${ansi}m${s}\x1b[0m` : s;

        const cy = ( s: string ) : string => highlight( s, '36' );
        const gy = ( s: string ) : string => highlight( s, '90' );
        const gn = ( s: string ) : string => highlight( s, '32' );
        const rd = ( s: string ) : string => highlight( s, '31' );
        const ye = ( s: string ) : string => highlight( s, '33' );

        const del = ( s: string ) : string => cli ? `\x1b[37;41m${s}\x1b[31;49m` : `-[${s}]`;
        const ins = ( s: string ) : string => cli ? `\x1b[37;42m${s}\x1b[32;49m` : `+[${s}]`;

        const header = ( e: DiffGroup | DiffLine ) : void => {

            out.push( `${ ( ' '.repeat( linePad ) ) }   ${ (
                cy( `@@ -${ ( e.line + 1 ) },${e.delSize} +${( e.line + 1 ) },${e.insSize} @@` )
            ) } ${ ( showChangeMagnitude ? ye( e.magnitude ) : '' ) }` );

        };

        const line = ( i: number, forced: number ) : void => {

            if ( linesA[ i ] || linesB[ i ] ) {

                const entry: DiffLine | undefined = this.entries.find( e => e.line === i );
                const lineNo: string = ( i + 1 ).toString().padStart( linePad, ' ' );

                if ( entry && forced === i ) {

                    out.push( `${lineNo} ${ rd( `- ${ mark( linesA[ i ], entry.diffs, 'del' ) }` ) }` );
                    out.push( `${ ' '.repeat( linePad ) } ${ gn( `+ ${ mark( linesB[ i ], entry.diffs, 'ins' ) }` ) }` );

                } else {

                    out.push( `${lineNo}   ${ gy( linesA[ i ] ) }` );

                }

            }

        };

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

        let out: string[] = [ '' ];

        if ( expandLines ) {

            for ( let i = 0; i <= maxLen; i++ ) line( i, i );

            out.push( '' );

        } else if ( groupedLines ) {

            for ( const group of this.grouped ) {

                header( group );

                for ( let i = group.start; i <= group.end; i++ ) line( i, i );

                out.push( '' );

            }

        } else {

            for ( const entry of this.entries ) {

                header( entry );

                for ( let i = entry.line - contextLines; i <= entry.line + contextLines; i++ ) line( i, entry.line );

                out.push( '' );

            }

        }

        return out.join( lineBreak );

    }

    public getStructuredDiff () : DiffLine[] {

        return this.entries;

    }

    public getGroupedDiff () : DiffGroup[] {

        return this.grouped;

    }

    public getASCIIDiff () : string {

        return this.output( false );

    }

    public getCLIDiff () : string {

        return this.output( true );

    }

}