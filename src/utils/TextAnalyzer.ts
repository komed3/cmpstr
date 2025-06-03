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
 * @module Utils/TextAnalyzer
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

export class TextAnalyzer {

    // The original text to analyze
    private readonly text: string;

    // Tokenized words and sentences
    private words: string[] = [];
    private sentences: string[] = [];

    // Frequency maps for characters and words
    private charFrequency: Map<string, number> = new Map ();
    private wordHistogram: Map<string, number> = new Map ();
    private syllableCache: Map<string, number> = new Map ();

    /**
     * Constructs a new TextAnalyzer instance with the provided input text.
     * 
     * @param {string} input - The text to analyze
     */
    constructor ( input: string ) {

        this.text = input.trim();

        this.tokenize();
        this.computeFrequencies();

    }

    /**
     * Tokenizes the input text into words and sentences.
     */
    private tokenize () : void {

        this.words = [], this.sentences = [];

        const text: string = this.text;
        const wordRegex: RegExp = /\p{L}+/gu;
        let match: RegExpExecArray | null;

        // Tokenize words using Unicode property escapes for letters
        while ( ( match = wordRegex.exec( text ) ) !== null ) {

            this.words.push( match[ 0 ].toLowerCase() );

        }

        // Tokenize sentences using punctuation marks as delimiters
        this.sentences = text.split( /(?<=[.!?])\s+/ ).filter( Boolean );

    }

    /**
     * Computes character and word frequencies from the tokenized text.
     */
    private computeFrequencies () : void {

        // Compute character frequencies
        for ( const char of this.text ) this.charFrequency.set( char, (
            this.charFrequency.get( char ) ?? 0
        ) + 1 );

        // Compute word frequencies
        for ( const word of this.words ) this.wordHistogram.set( word, (
            this.wordHistogram.get( word ) ?? 0
        ) + 1 );

    }

    /**
     * Estimates the number of syllables in a word using a simple heuristic.
     * 
     * @param {string} word - The word to estimate syllables for
     * @returns {number} - Estimated syllable count
     */
    private estimateSyllables ( word: string ) : number {

        // Check cache first to avoid redundant calculations
        if ( this.syllableCache.has( word ) ) return this.syllableCache.get( word )!;

        // Normalize the word: lowercase and remove non-letter characters
        const clean: string = word.toLowerCase().replace( /[^a-zäöüß]/g, '' );
        const matches: RegExpMatchArray | null = clean.match( /[aeiouyäöü]+/g );

        // Count syllables based on vowel groups
        const count: number = matches ? matches.length : 1;

        this.syllableCache.set( word, count );

        return count;

    }

    /**
     * Gets the original text length in characters.
     * 
     * @return {number} - Length of the text
     */
    public getLength () : number { return this.text.length }

    /**
     * Gets the number of words in the text.
     * 
     * @return {number} - Count of words
     */
    public getWordCount () : number { return this.words.length }

    /**
     * Gets the number of sentences in the text.
     * 
     * @return {number} - Count of sentences
     */
    public getSentenceCount () : number { return this.sentences.length }

    /**
     * Gets the average word length in the text.
     * 
     * @return {number} - Average length of words
     */
    public getAvgWordLength () : number {

        let totalLen: number = 0;

        for ( const w of this.words ) totalLen += w.length;

        return this.words.length ? totalLen / this.words.length : 0;

    }

    /**
     * Gets the average sentence length in words.
     * 
     * @return {number} - Average length of sentences
     */
    public getAvgSentenceLength () : number {

          return this.sentences.length ? this.words.length / this.sentences.length : 0;

    }

    /**
     * Gets a histogram of word frequencies in the text.
     * 
     * @returns {Record<string, number>} - A histogram of word frequencies
     */
    public getWordHistogram () : Record<string, number> {

        return Object.fromEntries( this.wordHistogram );

    }

    /**
     * Gets the most common words in the text, limited to a specified number.
     * 
     * @param {number} [limit=5] - Maximum number of common words to return
     * @returns {string[]} - Array of the most common words
     */
    public getMostCommonWords ( limit: number = 5 ) : string[] {

        return [ ...this.wordHistogram.entries() ]
            .sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
            .slice( 0, limit ).map( e => e[ 0 ] );

    }

    /**
     * Gets the least common words (hapax legomena) in the text.
     * 
     * Hapax legomena are words that occur only once in the text.
     * 
     * @returns {string[]} - Array of hapax legomena
     */
    public getHapaxLegomena () : string[] {

        return [ ...this.wordHistogram.entries() ]
            .filter( ( [ , c ] ) => c === 1 )
            .map( e => e[ 0 ] );

    }

    /**
     * Checks if the text contains any numbers.
     * 
     * @returns {boolean} - True if numbers are present, false otherwise
     */
    public hasNumbers () : boolean { return /\d/.test( this.text ) }

    /**
     * Calculates the ratio of uppercase letters to total letters in the text.
     * 
     * @return {number} - Ratio of uppercase letters to total letters
     */
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

    /**
     * Gets the frequency of each character in the text.
     * 
     * @returns {Record<string, number>} - A record of character frequencies
     */
    public getCharFrequency () : Record<string, number> {

        return Object.fromEntries( this.charFrequency );

    }

    /**
     * Gets the frequency of each Unicode block in the text.
     * 
     * @returns {Record<string, number>} - A record of Unicode block frequencies
     */
    public getUnicodeStats () : Record<string, number> {

        const result: Record<string, number> = {};

        for ( const [ char, count ] of this.charFrequency ) {

            // Get the Unicode block for the character
            const block: string = char
                .charCodeAt( 0 ).toString( 16 )
                .padStart( 4, '0' ).toUpperCase();

            // Increment the count for the block
            result[ block ] = ( result[ block ] ?? 0 ) + count;

        }

        return result;

    }

    /**
     * Gets the ratio of long words (words with length >= len) to total words.
     * 
     * @param {number} [len=7] - Minimum length for a word to be considered long
     * @returns {number} - Ratio of long words to total words
     */
    public getLongWordRatio ( len: number = 7 ) : number {

        let long: number = 0;

        for ( const w of this.words ) if ( w.length >= len ) long++;

        return this.words.length ? long / this.words.length : 0;

    }

    /**
     * Gets the ratio of short words (words with length <= len) to total words.
     * 
     * @param {number} [len=3] - Maximum length for a word to be considered short
     * @returns {number} - Ratio of short words to total words
     */
    public getShortWordRatio ( len: number = 3 ) : number {

        let short: number = 0;

        for ( const w of this.words ) if ( w.length <= len ) short++;

        return this.words.length ? short / this.words.length : 0;

    }

    /**
     * Estimates the number of syllables in the text.
     * 
     * @returns {number} - Total estimated syllable count
     */
    public getSyllablesCount () : number {

        let count: number = 0;

        for ( const w of this.words ) count += this.estimateSyllables( w );

        return count;

    }

    /**
     * Gets the number of monosyllabic words (words with exactly one syllable).
     * 
     * @returns {number} - Count of monosyllabic words
     */
    public getMonosyllabicWordCount () : number {

        let count: number = 0;

        for ( const w of this.words ) if ( this.estimateSyllables( w ) === 1 ) count++;

        return count;

    }

    /**
     * Gets the number of words with at least a specified minimum syllable count.
     * 
     * @param {number} min - Minimum syllable count for a word to be included
     * @returns {number} - Count of words meeting the syllable criteria
     */
    public getMinSyllablesWordCount ( min: number ) : number {

        let count: number = 0;

        for ( const w of this.words ) if ( this.estimateSyllables( w ) >= min ) count++;

        return count;

    }

    /**
     * Gets the number of words with at most a specified maximum syllable count.
     * 
     * @param {number} max - Maximum syllable count for a word to be included
     * @returns {number} - Count of words meeting the syllable criteria
     */
    public getMaxSyllablesWordCount ( max: number ) : number {

        let count: number = 0;

        for ( const w of this.words ) if ( this.estimateSyllables( w ) <= max ) count++;

        return count;

    }

    /**
     * Calculates the Honore's R statistic for the text as a measure of lexical richness.
     * 
     * @returns {number} - The Honore's R statistic
     */
    public getHonoresR () : number {

        return ( 100 * Math.log( this.words.length ) ) / ( 1 - (
            this.getHapaxLegomena().length / ( this.wordHistogram.size ?? 1 )
        ) );

    }

    /**
     * Estimates the reading time for the text based on words per minute (WPM).
     * 
     * @param {number} [wpm=200] - Words per minute for the calculation
     * @returns {number} - Estimated reading time in minutes
     */
    public getReadingTime ( wpm: number = 200 ) : number {

        return Math.max( 1, this.words.length / ( wpm ?? 1 ) );

    }

    /**
     * Calculates various readability scores based on the text.
     * 
     * This method supports multiple readability metrics:
     *  - Flesch Reading Ease
     *  - Flesch-Kincaid Grade Level
     * 
     * @param {('flesch' | 'fleschde' | 'kincaid')} [metric='flesch'] - The readability metric to calculate
     * @returns {number} - The calculated readability score
     */
    public getReadabilityScore ( metric: 'flesch' | 'fleschde' | 'kincaid' = 'flesch' ) : number {

        const w: number = this.words.length || 1;
        const s: number = this.sentences.length || 1;
        const y: number = this.getSyllablesCount() || 1;

        const asl: number = w / s;
        const asw: number = y / w;

        switch ( metric ) {

            // Flesch Reading Ease formula
            case 'flesch': return 206.835 - ( 1.015 * asl ) - ( 84.6 * asw );

            // Flesch Reading Ease formula for German texts
            case 'fleschde': return 180 - asl - ( 58.5 * asw );

            // Flesch-Kincaid Grade Level formula
            case 'kincaid': return ( 0.39 * asl ) + ( 11.8 * asw ) - 15.59;

        }

    }

    /**
     * Calculates the LIX (Lesbarhetsindex) score for the text.
     * 
     * The LIX score is a readability index that combines average word length and sentence length.
     * 
     * @returns {number} - The LIX score
     */
    public getLIXScore () : number {

        const w: number = this.words.length || 1;
        const s: number = this.sentences.length || 1;
        const l: number = this.getLongWordRatio() * w;

        return ( w / s ) + ( l / w * 100 );

    }

    /**
     * Calculates the Wiener Sachtextformel (WSTF) scores for the text.
     * 
     * The WSTF scores are a set of readability metrics based on word and sentence characteristics.
     * 
     * @returns {[number, number, number, number]} - An array of WSTF scores
     */
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