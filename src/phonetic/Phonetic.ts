'use strict';

import type { PhoneticMapping, PhoneticMap, PhoneticOptions } from '../utils/Types';

export abstract class Phonetic {

    protected static default: PhoneticOptions;

    protected static mapping: PhoneticMapping;

    constructor (
        protected readonly map: PhoneticMap,
        protected readonly options: PhoneticOptions
    ) {

        if ( this.map === undefined ) throw new Error (
            `requested mapping <${this.options.map}> is not declared`
        );

    }

    protected applyRules ( char: string, i: number, chars: string[], charLen: number ) : string | undefined {

        const { ruleset = [] } = this.map;

        if ( ! ruleset || ! ruleset.length ) return undefined;

        const prev: string = chars[ i - 1 ] || '', prev2: string = chars[ i - 2 ] || '';
        const next: string = chars[ i + 1 ] || '', next2: string = chars[ i + 2 ] || '';

        for ( const rule of ruleset ) {

            if ( rule.char && rule.char !== char ) continue;

            if ( rule.position === 'start' && i !== 0 ) continue;
            if ( rule.position === 'middle' && i > 0 && i < charLen ) continue;
            if ( rule.position === 'end' && i !== charLen ) continue;

            if ( rule.prev && ! rule.prev.includes( prev ) ) continue;
            if ( rule.prevNot && rule.prevNot.includes( prev ) ) continue;
            if ( rule.prev2 && ! rule.prev2.includes( prev2 ) ) continue;
            if ( rule.prev2Not && rule.prev2Not.includes( prev2 ) ) continue;

            if ( rule.next && ! rule.next.includes( next ) ) continue;
            if ( rule.nextNot && rule.nextNot.includes( next ) ) continue;
            if ( rule.next2 && ! rule.next2.includes( next2 ) ) continue;
            if ( rule.next2Not && rule.next2Not.includes( next2 ) ) continue;

            if ( rule.leading && ! rule.leading.includes(
                chars.slice( 0, rule.leading.length ).join( '' )
            ) ) continue;

            if ( rule.trailing && ! rule.trailing.includes(
                chars.slice( -rule.trailing.length ).join( '' )
            ) ) continue;

            if ( rule.match && ! rule.match.every(
                ( c: string, j: number ) => chars[ i + j ] === c
            ) ) continue;

            return rule.code;

        }

        return undefined;

    }

    protected word2Chars ( word: string ) : string[] {

        return word.toLowerCase().split( '' );

    }

    protected char2Code (
        char: string, i: number, chars: string[], charLen: number,
        lastCode: string | null, map: Record<string, string>
    ) : string | undefined {

        const c = this.applyRules( char, i, chars, charLen ) ?? map[ char ] ?? undefined;

        return c === lastCode ? undefined : c;

    }

    protected adjustCode ( code: string, chars: string[] ) : string {

        return code.replaceAll( '0', '' );

    }

    protected equalLen ( input: string ) : string {

        const { length = -1, pad = '0' } = this.options;

        return length === -1 ? input : ( input + pad.repeat( length ) ).slice( 0, length );

    }

    protected phoneticCode ( word: string ) : string {

        const { map = {}, ignore = [] } = this.map;

        const chars: string[] = this.word2Chars( word );
        const charLen: number = chars.length;

        let code: string = '', lastCode: string | null = null;

        for ( let i = 0; i < charLen; i++ ) {

            const char: string = chars[ i ];

            if ( ignore.includes( char ) ) continue;

            const mapped: string | undefined = this.char2Code(
                char, i, chars, charLen, lastCode, map
            );

            if ( mapped === undefined ) continue;

            code += mapped, lastCode = mapped;

        }

        return this.adjustCode( code, chars );

    }

    protected loop ( words: string[] ) : string[] {

        const index: string[] = [];

        for ( const word of words ) {

            const code: string = this.phoneticCode( word );

            if ( code && code.length ) index.push( this.equalLen( code ) );

        }

        return index;

    }

    public getIndex ( input: string ) : string[] {

        const { delimiter = ' ' } = this.options;

        return this.loop( input.split( delimiter ).filter( Boolean ) ).filter( Boolean );

    }

}