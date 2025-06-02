/**
 * TextAnalyzer Utility
 * src/utils/TextAnalyzer.ts
 * 
 * The TextAnalyzer class provides a comprehensive set of methods for analyzing and
 * extracting statistics from a given text. It supports word and sentence tokenization,
 * character and word frequency analysis, syllable estimation, readability metrics
 * (Flesch, Kincaid, LIX, WSTF), and various ratios and histograms. Designed for
 * efficiency and flexibility, it is suitable for linguistic research, readability
 * scoring, and text preprocessing tasks.
 * 
 * @module TextAnalyzer
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

export class TextAnalyzer {

    private readonly text: string;

    private words: string[] = [];
    private sentences: string[] = [];

    private charFrequency: Map<string, number> = new Map ();
    private wordHistogram: Map<string, number> = new Map ();
    private syllableCache: Map<string, number> = new Map ();

    constructor ( input: string ) {

        this.text = input.trim();

        this.tokenize();
        this.computeFrequencies();

    }

    private tokenize () : void {

        this.words = [], this.sentences = [];

        const text: string = this.text;
        const wordRegex: RegExp = /\p{L}+/gu;
        let match: RegExpExecArray | null;

        while ( ( match = wordRegex.exec( text ) ) !== null ) {

            this.words.push( match[ 0 ].toLowerCase() );

        }

        this.sentences = text.split( /(?<=[.!?])\s+/ ).filter( Boolean );

    }

    private computeFrequencies () : void {

      for ( const char of this.text ) this.charFrequency.set( char, (
          this.charFrequency.get( char ) ?? 0
      ) + 1 );

      for ( const word of this.words ) this.wordHistogram.set( word, (
          this.wordHistogram.get( word ) ?? 0
      ) + 1 );

    }

    private estimateSyllables ( word: string ) : number {

        if ( this.syllableCache.has( word ) ) return this.syllableCache.get( word )!;

        const clean: string = word.toLowerCase().replace( /[^a-zäöüß]/g, '' );

        const matches: RegExpMatchArray | null = clean.match( /[aeiouyäöü]+/g );

        const count: number = matches ? matches.length : 1;

        this.syllableCache.set( word, count );

        return count;

    }

    public getLength () : number {

        return this.text.length;

    }

    public getWordCount () : number {

        return this.words.length;

    }

    public getSentenceCount () : number {

      return this.sentences.length;

    }

    public getAvgWordLength () : number {

        let totalLen: number = 0;

        for ( const w of this.words ) totalLen += w.length;

        return this.words.length ? totalLen / this.words.length : 0;

    }

    public getAvgSentenceLength () : number {

          return this.sentences.length ? this.words.length / this.sentences.length : 0;

    }

    public getWordHistogram () : Record<string, number> {

        return Object.fromEntries( this.wordHistogram );

    }

    public getMostCommonWords ( limit: number = 5 ) : string[] {

        return [ ...this.wordHistogram.entries() ]
            .sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
            .slice( 0, limit ).map( e => e[ 0 ] );

    }

    public hasNumbers () : boolean {

        return /\d/.test( this.text );

    }

    public getUpperCaseRatio () : number {

        let upper: number = 0, letters: number = 0;

        for ( let i = 0, len = this.text.length; i < len; i++ ) {

            const c: string = this.text[ i ];

            if ( /[A-Za-zÄÖÜäöüß]/.test( c ) ) {

                letters++;

                if ( /[A-ZÄÖÜ]/.test( c ) ) upper++;

            }

        }

        return letters ? upper / letters : 0;

    }

    public getCharFrequency () : Record<string, number> {

        return Object.fromEntries( this.charFrequency );

    }

    public getUnicodeStats () : Record<string, number> {

        const result: Record<string, number> = {};

        for ( const [ char, count ] of this.charFrequency ) {

          const block: string = char
              .charCodeAt( 0 ).toString( 16 )
              .padStart( 4, '0' ).toUpperCase();

          result[ block ] = ( result[ block ] ?? 0 ) + count;

        }

        return result;

    }

    public getLongWordRatio ( len: number = 7 ) : number {

        let long: number = 0;

        for ( const w of this.words ) if ( w.length >= len ) long++;

        return this.words.length ? long / this.words.length : 0;

    }

    public getShortWordRatio ( len: number = 3 ) : number {

        let short: number = 0;

        for ( const w of this.words ) if ( w.length <= len ) short++;

        return this.words.length ? short / this.words.length : 0;

    }

    public getSyllablesCount () : number {

        let count: number = 0;

        for ( const w of this.words ) count += this.estimateSyllables( w );

        return count;

    }

    public getMonosyllabicWordCount () : number {

        let count: number = 0;

        for ( const w of this.words ) if ( this.estimateSyllables( w ) === 1 ) count++;

        return count;

    }

    public getMinSyllablesWordCount ( min: number ) : number {

        let count: number = 0;

        for ( const w of this.words ) if ( this.estimateSyllables( w ) >= min ) count++;

        return count;

    }

    public getMaxSyllablesWordCount ( max: number ) : number {

        let count: number = 0;

        for ( const w of this.words ) if ( this.estimateSyllables( w ) <= max ) count++;

        return count;

    }

    public getReadingTime ( options?: { wpm?: number } ) : number {

        const wps: number = ( options?.wpm ?? 200 ) / 60;

        return Math.max( 1, this.words.length / wps );

    }

    public getReadabilityScore ( metric: 'flesch' | 'fleschde' | 'kincaid' = 'flesch' ) : number {

        const w: number = this.words.length || 1;
        const s: number = this.sentences.length || 1;
        const y: number = this.getSyllablesCount() || 1;

        const asl: number = w / s;
        const asw: number = y / w;

        switch ( metric ) {

            case 'flesch': return 206.835 - ( 1.015 * asl ) - ( 84.6 * asw );

            case 'fleschde': return 180 - asl - ( 58.5 * asw );

            case 'kincaid': return ( 0.39 * asl ) + ( 11.8 * asw ) - 15.59;

        }

    }

    public getLIXScore () : number {

        const w: number = this.words.length || 1;
        const s: number = this.sentences.length || 1;
        const l: number = this.getLongWordRatio() * w;

        return ( w / s ) + ( l / w * 100 );

    }

    public getWSTFScore () : [ number, number, number, number ] {

        const w: number = this.words.length || 1;

        const h: number = this.getMinSyllablesWordCount( 3 ) / w * 100;
        const s: number = this.getAvgSentenceLength();
        const l: number = this.getLongWordRatio() * 100;
        const m: number = this.getMonosyllabicWordCount() / w * 100;

        return [
            0.1935 * h + 0.1672 * s + 0.1297 * l - 0.0327 * m - 0.8750,
            0.2007 * h + 0.1682 * s + 0.1373 * l              - 2.7790,
            0.2963 * h + 0.1905 * s                           - 1.1144,
            0.2744 * h + 0.2656 * s                           - 1.6930
        ];

    }

}