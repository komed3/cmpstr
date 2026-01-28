/**
 * DiffChecker Utility
 * src/utils/DiffChecker.ts
 * 
 * The DiffChecker class provides a robust and efficient utility for comparing two
 * texts and extracting their differences (full lines or word mode). It supports
 * context-aware grouping of changes, unified diff output (with CLI color or ASCII
 * markup), and detailed change magnitude metrics. The class is highly configurable,
 * allowing users to choose the diff granularity, case sensitivity, context lines,
 * grouping, and output style. It is suitable for text comparison, code review
 * tools, document versioning, and any application requiring precise and human-
 * readable difference reporting.
 * 
 * Features:
 *  - Line and word-based diffing
 *  - Case-insensitive comparison option
 *  - Context lines and grouping of adjacent changes
 *  - Unified diff output (ASCII or colored CLI)
 *  - Highlighting of changed segments within lines
 *  - Change magnitude calculation (relative to group or line)
 *  - Expand-all mode for full file context
 * 
 * @module Utils
 * @name DiffChecker
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { DiffEntry, DiffGroup, DiffLine, DiffOptions } from './Types';

/**
 * The DiffChecker class provides methods to compare two texts and generate
 * structured diffs, grouped diffs, and unified diff outputs.
 */
export class DiffChecker {

    /** Original input texts and options */
    private readonly a: string;
    private readonly b: string;
    private readonly options: Required< DiffOptions >;

    /** Computed diff entries and groups */
    private entries: DiffLine[] = [];
    private grouped: DiffGroup[] = [];

    /** Flag to indicate if the diff has already been computed */
    private diffRun: boolean = false;

    /**
     * Constructs a new DiffChecker instance for comparing two texts.
     * 
     * @param {string} a - The first (original) text
     * @param {string} b - The second (modified) text
     * @param {DiffOptions} [opt] - Optional diff configuration
     */
    constructor ( a: string, b: string, opt: DiffOptions = {} ) {
        this.a = a, this.b = b;

        // Merge default with user-provided options
        this.options = { ...{
            mode: 'word',
            caseInsensitive: false,
            contextLines: 1,
            groupedLines: true,
            expandLines: false,
            showChangeMagnitude: true,
            maxMagnitudeSymbols: 5,
            lineBreak: '\n'
        }, ...opt };

        // Run the diff computation immediately
        this.computeDiff();
    }

    /**
     * Splits both input texts into arrays of lines and returns them with the maximum line count.
     * 
     * @returns { linesA: string[], linesB: string[], maxLen: number }
     */
    private text2lines () : { linesA: string[], linesB: string[], maxLen: number; } {
        const linesA = this.a.trim().split( /\r?\n/ );
        const linesB = this.b.trim().split( /\r?\n/ );

        return { linesA, linesB, maxLen: Math.max( linesA.length, linesB.length ) };
    }

    /**
     * Tokenizes a string according to the current diff mode (line or word).
     * 
     * @param {string} input - The string to tokenize
     * @returns {string[]} - Array of tokens
     */
    private tokenize ( input: string ) : string[] {
        switch ( this.options.mode ) {
            case 'line': return [ input ];
            case 'word': return input.split( /\s+/ );
        }
    }

    /**
     * Concatenates an array of tokens back into a string, respecting the diff mode.
     * 
     * @param {string[]} input - Array of tokens
     * @returns {string} - Concatenated string
     */
    private concat ( input: string[] ) : string {
        return input.join( this.options.mode === 'word' ? ' ' : '' );
    }

    /**
     * Computes the diff between the two input texts and populates the
     * entries and grouped arrays.
     */
    private computeDiff () : void {
        if ( this.diffRun ) return;

        // Get the lines from both texts
        const { linesA, linesB, maxLen } = this.text2lines();

        // Loop through each line and compare them
        for ( let i = 0; i < maxLen; i++ ) this.lineDiff( linesA[ i ] || '', linesB[ i ] || '', i );

        // Find groups of adjacent changes and set diff run flag to true
        this.findGroups();
        this.diffRun = true;
    }

    /**
     * Compares two lines and records their differences at the configured granularity.
     * 
     * @param {string} a - Line from the first text
     * @param {string} b - Line from the second text
     * @param {number} line - Line number
     */
    private lineDiff ( a: string, b: string, line: number ) : void {
        const { mode, caseInsensitive } = this.options;
        const baseLen = Math.max( a.length, b.length );
        let A = a, B = b;

        // If case-insensitive mode is enabled, convert both lines to lowercase
        if ( caseInsensitive ) A = a.toLowerCase(), B = b.toLowerCase();

        let diffs: DiffEntry[] = [];
        let delSize = 0, insSize = 0;

        switch ( mode ) {
            case 'line': // For line mode, compare the entire lines directly
                if ( A !== B ) {
                    diffs.push( {
                        posA: 0, posB: 0,
                        del: a, ins: b,
                        size: b.length - a.length
                    } );

                    delSize = a.length;
                    insSize = b.length;
                }
                break;

            case 'word': // For word mode, find precise diffs between tokenized lines
                diffs = this.preciseDiff( a, A, b, B );
                for ( const d of diffs ) delSize += d.del.length, insSize += d.ins.length;
                break;
        }

        // Add the diff entry for this line
        if ( diffs.length ) this.entries.push( {
            line, diffs, delSize, insSize, baseLen,
            totalSize: insSize - delSize,
            magnitude: this.magnitude( delSize, insSize, baseLen )
        } );
    }

    /**
     * Finds all minimal diff blocks between two tokenized strings,
     * returning original text and positions.
     * 
     * @param {string} a - Original line (case preserved)
     * @param {string} A - Original line (possibly lowercased)
     * @param {string} b - Modified line (case preserved)
     * @param {string} B - Modified line (possibly lowercased)
     * @returns {DiffEntry[]} - Array of diff entries for this line
     */
    private preciseDiff ( a: string, A: string, b: string, B: string ) : DiffEntry[] {
        // Helper function to calculate positions of tokens in the original text
        const posIndex = ( t: string[] ) : number[] => t.reduce(
            ( p, _, i ) => ( p.push( i ? p[ i - 1 ] + t[ i - 1 ].length + 1 : 0 ), p ),
            [] as number[]
        );

        // Original and tokenized arrays, their lengths and position arrays
        const origA = this.tokenize( a );
        const origB = this.tokenize( b );
        const tokenA = this.tokenize( A );
        const tokenB = this.tokenize( B );
        const lenA = tokenA.length;
        const lenB = tokenB.length;
        const posArrA = posIndex( origA );
        const posArrB = posIndex( origB );

        // Find all matching blocks (LCS)
        const matches: Array< { ai: number, bi: number, len: number } > = [];
        let ai = 0, bi = 0;

        while ( ai < lenA && bi < lenB ) {
            // If tokens match, find the length of the match
            if ( tokenA[ ai ] === tokenB[ bi ] ) {
                let len: number = 1;

                // Extend the match as long as tokens continue to match
                while (
                    ai + len < lenA && bi + len < lenB &&
                    tokenA[ ai + len ] === tokenB[ bi + len ]
                ) len++;

                matches.push( { ai, bi, len } );
                ai += len, bi += len;
            } else {
                let found: boolean = false;

                // Look ahead for next sync point (greedy, but avoids long tails)
                for ( let offset = 1; offset <= 3 && ! found; offset++ ) {
                    // Check if the next token in A matches the current token in B
                    if ( ai + offset < lenA && tokenA[ ai + offset ] === tokenB[ bi ] ) {
                        matches.push( { ai: ai + offset, bi, len: 1 } );
                        ai += offset + 1, bi += 1, found = true;
                    }

                    // Check if the next token in B matches the current token in A
                    else if ( bi + offset < lenB && tokenA[ ai ] === tokenB[ bi + offset ] ) {
                        matches.push( { ai, bi: bi + offset, len: 1 } );
                        ai += 1, bi += offset + 1, found = true;
                    }
                }

                // If no match was found, advance both pointers by one
                if ( ! found ) ai++, bi++;
            }
        }

        // Walk through tokens and emit diffs between matches
        const diffs: DiffEntry[] = [];
        let i = 0, j = 0;

        for ( const m of matches ) {
            // If there are unmatched tokens before the match, record them
            if ( i < m.ai || j < m.bi ) {
                // Slice the original arrays to get the unmatched tokens
                const delArr = origA.slice( i, m.ai );
                const insArr = origB.slice( j, m.bi );

                // Push the diff entry for unmatched tokens
                diffs.push( {
                    posA: posArrA[ i ] ?? 0,
                    posB: posArrB[ j ] ?? 0,
                    del: this.concat( delArr ),
                    ins: this.concat( insArr ),
                    size: insArr.join( '' ).length - delArr.join( '' ).length
                } );
            }

            // Advance to after the match
            i = m.ai + m.len, j = m.bi + m.len;
        }

        // Tail diffs after the last match
        if ( i < lenA || j < lenB ) {
            // Slice the original arrays to get the unmatched tokens
            const delArr = origA.slice( i );
            const insArr = origB.slice( j );

            // Push the diff entry for unmatched tokens at the end
            diffs.push( {
                posA: posArrA[ i ] ?? 0,
                posB: posArrB[ j ] ?? 0,
                del: this.concat( delArr ),
                ins: this.concat( insArr ),
                size: insArr.join( '' ).length - delArr.join( '' ).length
            } );
        }

        // Remove empty diffs
        return diffs.filter( d => d.del.length > 0 || d.ins.length > 0 );
    }

    /**
     * Groups adjacent changed lines together, including context lines,
     * and calculates group metrics.
     */
    private findGroups () : void {
        const { contextLines } = this.options;

        // Helper function to add a group to the grouped array
        const addGroup = ( group: DiffLine[], start: number, end: number ) : void => {
            // Calculate total sizes and base length for the group
            const [ delSize, insSize, totalSize, baseLen ] = [
                'delSize', 'insSize', 'totalSize', 'baseLen'
            ].map( k => group.reduce(
                ( sum, e ) => sum + ( e as any )[ k ], 0
            ) );

            // Push the group to the grouped array
            this.grouped.push( {
                start, end, delSize, insSize, totalSize,
                line: group[ 0 ].line, entries: group,
                magnitude: this.magnitude( delSize, insSize, baseLen )
            } );
        };

        let group: DiffLine[] = [];
        let start = 0, end = 0;

        // Iterate through each diff entry to find groups
        for ( const entry of this.entries ) {
            const s = Math.max( 0, entry.line - contextLines );
            const e = entry.line + contextLines;

            // If the group is empty or the current entry is adjacent to the last one
            if ( ! group.length || s <= end + 1 ) {
                // If this is the first entry, set the start position
                if ( ! group.length ) start = s;

                end = Math.max( end, e );
                group.push( entry );
            } else {
                // If the group is not empty, finalize it and start a new one
                addGroup( group, start, end );

                group = [ entry ], start = s, end = e;
            }
        }

        // If there is a remaining group, finalize it
        if ( group.length ) addGroup( group, start, end );
    }

    /**
     * Calculates the change magnitude string for a group or line.
     * 
     * @param {number} del - Number of deleted characters
     * @param {number} ins - Number of inserted characters
     * @param {number} baseLen - Base length for normalization
     * @returns {string} - Magnitude string (e.g. "++-")
     */
    private magnitude ( del: number, ins: number, baseLen: number ) : string {
        const { maxMagnitudeSymbols } = this.options;
        const total: number = del + ins;

        // If there are no changes or base length is zero, return empty string
        if ( total === 0 || baseLen === 0 ) return '';

        // Calculate the length of the magnitude string based on the full length
        const magLen: number = Math.min( maxMagnitudeSymbols, Math.max(
            Math.round( total / baseLen * maxMagnitudeSymbols ), 1
        ) );

        // Calculate the number of plus and minus symbols
        const plus = Math.round( ( ins / total ) * magLen );
        const minus = magLen - plus;

        // Return the magnitude string with plus and minus symbols
        return '+'.repeat( plus ) + '-'.repeat( minus );
    }

    /**
     * Generates a unified diff output as a string, with optional CLI coloring.
     * 
     * @param {boolean} cli - If true, use CLI colors; otherwise, ASCII markup
     * @returns {string} - Unified diff output
     */
    private output ( cli: boolean ) : string {
        const { mode, contextLines, groupedLines, expandLines, showChangeMagnitude, lineBreak } = this.options;

        // Get the lines and maximum length from the input texts
        const { linesA, linesB, maxLen } = this.text2lines();
        const linePad = Math.max( 4, maxLen.toString().length );

        // Helper functions for coloring and formatting (ASCII or CLI colored)
        const highlight = ( s: string, ansi: string ) : string => cli ? `\x1b[${ansi}m${s}\x1b[0m` : s;

        const cy = ( s: string ) : string => highlight( s, '36' );
        const gy = ( s: string ) : string => highlight( s, '90' );
        const gn = ( s: string ) : string => highlight( s, '32' );
        const rd = ( s: string ) : string => highlight( s, '31' );
        const ye = ( s: string ) : string => highlight( s, '33' );

        const del = ( s: string ) : string => cli ? `\x1b[37;41m${s}\x1b[31;49m` : `-[${s}]`;
        const ins = ( s: string ) : string => cli ? `\x1b[37;42m${s}\x1b[32;49m` : `+[${s}]`;

        // Function to output a block of lines with optional header
        const block = ( start: number, end: number, forced?: number, headerEntry?: DiffGroup | DiffLine ) : void => {
            // If there is a header entry, output the header
            if ( headerEntry ) header( headerEntry );

            // Loop through the range and output lines
            for ( let i = start; i <= end; i++ ) line( i, forced ?? i );
            out.push( '' );
        };

        // Function to output a header for a group or line
        const header = ( e: DiffGroup | DiffLine ) : void => {
            out.push( `${ ( ' '.repeat( linePad ) ) }   ${ (
                cy( `@@ -${ ( e.line + 1 ) },${e.delSize} +${( e.line + 1 ) },${e.insSize} @@` )
            ) } ${ ( showChangeMagnitude ? ye( e.magnitude ) : '' ) }` );
        };

        // Function to output a single line with optional diff highlighting
        const line = ( i: number, forced: number ) : void => {
            // If the line exists in either text, output it
            if ( linesA[ i ] || linesB[ i ] ) {
                // Find the diff entry for this line, if it exists
                const entry = this.entries.find( e => e.line === i );

                // Format the line number with padding
                const lineNo = ( i + 1 ).toString().padStart( linePad, ' ' );

                if ( entry && forced === i ) {
                    // If there is an entry, output the line with diff highlighting
                    out.push( `${lineNo} ${ rd( `- ${ mark( linesA[ i ], entry.diffs, 'del' ) }` ) }` );
                    out.push( `${ ' '.repeat( linePad ) } ${ gn( `+ ${ mark( linesB[ i ], entry.diffs, 'ins' ) }` ) }` );
                } else {
                    // If no entry, just output the line without diff (context lines)
                    out.push( `${lineNo}   ${ gy( linesA[ i ] ) }` );
                }
            }
        };

        // Function to mark changes in a line based on the diffs
        const mark = ( line: string, diffs: DiffEntry[], type: 'del' | 'ins' ) : string => {
            // If there are no diffs or the mode is line, return the line as is
            if ( ! diffs.length || mode === 'line' ) return line;

            let res = '', idx = 0;

            // Loop through each diff entry and apply the changes
            for ( const d of diffs ) {
                // Get the position and value based on the type
                const pos = type === 'del' ? d.posA : d.posB;
                const val = type === 'del' ? d.del : d.ins;

                // If the value is empty, skip it
                if ( ! val ) continue;

                // Add the unchanged part of the line before the change
                if ( pos > idx ) res += line.slice( idx, pos );

                // Add the changed part of the line with appropriate formatting
                res += ( type === 'del' ? del( val ) : ins( val ) );
                idx = pos + val.length;
            }

            // Return the marked line with any remaining unchanged part
            return res + line.slice( idx );
        };

        let out: string[] = [ '' ];

        switch ( true ) {
            case expandLines: // For expandLines, output the entire file context
                block( 0, maxLen );
                break;

            case groupedLines: // For groupedLines, output each group with its start and end
                for ( const group of this.grouped ) block(
                    group.start, group.end, undefined, group
                );
                break;

            default: // For individual lines, output each entry with context lines
                for ( const entry of this.entries ) block(
                    entry.line - contextLines, entry.line + contextLines, entry.line, entry
                );
                break;
        }

        // Output the final diff as a string (ASCII or CLI colored)
        return out.join( lineBreak );
    }

    /**
     * Returns the structured diff as an array of DiffLine objects.
     * 
     * @returns {DiffLine[]} - Array of line-level diffs
     */
    public getStructuredDiff = () : DiffLine[] => this.entries;

    /**
     * Returns the grouped diff as an array of DiffGroup objects.
     * 
     * @returns {DiffGroup[]} - Array of grouped diffs
     */
    public getGroupedDiff = () : DiffGroup[] => this.grouped;

    /**
     * Returns the unified diff as a plain ASCII string.
     * 
     * @returns {string} - Unified diff (ASCII)
     */
    public getASCIIDiff = () : string => this.output( false );

    /**
     * Returns the unified diff as a CLI-colored string.
     * 
     * @returns {string} - Unified diff (CLI colors)
     */
    public getCLIDiff = () : string => this.output( true );

}
