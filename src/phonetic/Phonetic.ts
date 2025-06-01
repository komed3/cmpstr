/**
 * Abstract Phonetic
 * src/phonetic/Phonetic.ts
 * 
 * @see https://en.wikipedia.org/wiki/Phonetic_algorithm
 * 
 * A phonetic algorithm refers to a method for indexing words according to their
 * pronunciation. When the algorithm relies on orthography, it is significantly
 * influenced by the spelling conventions of the language for which it is intended:
 * since the majority of phonetic algorithms were created for English, they tend
 * to be less effective for indexing words in other languages.
 * 
 * Phonetic search has numerous applications, and one of the initial use cases has
 * been in trademark searches to verify that newly registered trademarks do not
 * pose a risk of infringing upon existing trademarks due to their pronunciation.
 * 
 * This module provides an abstract class for generating phonetic indices based
 * on mappings and rules. It allows for the implementation of various phonetic
 * algorithms by extending the abstract class.
 * 
 * @module Phonetic
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticMapping, PhoneticMap, PhoneticOptions } from '../utils/Types';

/**
 * Abstract class representing a phonetic algorithm.
 * 
 * The protected methods `applyRules`, `encode`, `mapChar`, `equalLen`, `word2Chars`,
 * `exitEarly`, `adjustCode`, `loop` and `loopAsync` can be overridden in subclasses
 * to implement specific phonetic algorithms.
 * 
 * @abstract
 */
export abstract class Phonetic {

    /**
     * Default phonetic options.
     * 
     * This object contains default settings for phonetic algorithms,
     * implemented in the subclass.
     */
    protected static default: PhoneticOptions;

    /**
     * Phonetic mapping used for phonetic algorithms.
     * 
     * This mapping is used to convert words into their phonetic representation
     * based on the specific phonetic algorithm implemented in the subclass.
     */
    protected static mappings: PhoneticMapping;

    // Phonetic map and options for the algorithm
    protected readonly map: PhoneticMap;
    protected readonly options: PhoneticOptions;

    /**
     * Constructor for the Phonetic class.
     * 
     * Initializes the phonetic algorithm with the specified options and mapping.
     * 
     * @param {PhoneticOptions} options - Options for the phonetic algorithm
     * @throws {Error} - If the requested mapping is not declared
     */
    constructor ( options: PhoneticOptions ) {

        // Get the class constructor to access static properties
        const cls: typeof Phonetic = this.constructor as typeof Phonetic;

        // Set the options by merging the default options with the provided ones
        this.options = { ...( ( cls as any ).default ?? {} ), ...options };

        // Get the mapping based on the provided options
        this.map = cls.mappings[ this.options.map! ];

        // If the mapping is not defined, throw an error
        if ( this.map === undefined ) throw new Error (
            `requested mapping <${this.options.map}> is not declared`
        );

    }

    /**
     * Applies phonetic rules to a character in a word context.
     * 
     * This method is designed to be generic and efficient for all phonetic algorithms.
     * It checks all rule types (prev, next, prevNot, nextNot, position, etc.) and
     * returns either the appropriate code (string) or undefined.
     * 
     * @param {string} char - The current character
     * @param {number} i - The current position within the word
     * @param {string[]} chars - The word as an array of characters
     * @param {number} charLen - The total length of the word
     * @returns {string|undefined} - The rule code or undefined if no rule applies
     */
    protected applyRules ( char: string, i: number, chars: string[], charLen: number ) : string | undefined {

        const { ruleset = [] } = this.map;

        // If no rules are provided, return undefined
        if ( ! ruleset || ! ruleset.length ) return undefined;

        // Get the surrounding characters
        const prev: string = chars[ i - 1 ] || '', prev2: string = chars[ i - 2 ] || '';
        const next: string = chars[ i + 1 ] || '', next2: string = chars[ i + 2 ] || '';

        // Iterate over the rules to find a matching rule for the current character
        for ( const rule of ruleset ) {

            // Skip if the rule does not match the current character
            if ( rule.char && rule.char !== char ) continue;

            // Position in the word (start, middle, end)
            if ( rule.position === 'start' && i !== 0 ) continue;
            if ( rule.position === 'middle' && i > 0 && i < charLen ) continue;
            if ( rule.position === 'end' && i !== charLen ) continue;

            // Previous character(s)
            if ( rule.prev && ! rule.prev.includes( prev ) ) continue;
            if ( rule.prevNot && rule.prevNot.includes( prev ) ) continue;
            if ( rule.prev2 && ! rule.prev2.includes( prev2 ) ) continue;
            if ( rule.prev2Not && rule.prev2Not.includes( prev2 ) ) continue;

            // Following character(s)
            if ( rule.next && ! rule.next.includes( next ) ) continue;
            if ( rule.nextNot && rule.nextNot.includes( next ) ) continue;
            if ( rule.next2 && ! rule.next2.includes( next2 ) ) continue;
            if ( rule.next2Not && rule.next2Not.includes( next2 ) ) continue;

            // Special case: Beginning of a word (e.g. chars.slice(0, n))
            if ( rule.leading && ! rule.leading.includes(
                chars.slice( 0, rule.leading.length ).join( '' )
            ) ) continue;

            // Special case: end of word (e.g. chars.slice(-n))
            if ( rule.trailing && ! rule.trailing.includes(
                chars.slice( -rule.trailing.length ).join( '' )
            ) ) continue;

            // Check multiple characters (e.g. bigram/trigram)
            if ( rule.match && ! rule.match.every(
                ( c: string, j: number ) => chars[ i + j ] === c
            ) ) continue;

            // If all conditions met, return the rule code
            return rule.code;

        }

        // If no rule matched, return undefined
        return undefined;

    }

    /**
     * Generates the phonetic code for a given word.
     * 
     * This method processes the word character by character, applying phonetic rules
     * and mappings to generate a phonetic code.
     * 
     * @param {string} word - The input word to be converted into a phonetic code
     * @returns {string} - The generated phonetic code
     */
    protected encode ( word: string ) : string {

        const { map = {}, ignore = [] } = this.map;

        // Get the characters of the word and its length
        const chars: string[] = this.word2Chars( word );
        const charLen: number = chars.length;

        let code: string = '', lastCode: string | null = null;

        // Iterate over each character in the word
        for ( let i = 0; i < charLen; i++ ) {

            const char: string = chars[ i ];

            // Skip characters that are in the ignore list
            if ( ignore.includes( char ) ) continue;

            // Convert the character to its phonetic code
            const mapped: string | undefined = this.mapChar(
                char, i, chars, charLen, lastCode, map
            );

            // If no code is generated, skip to the next character
            if ( mapped === undefined ) continue;

            // Append the generated code to the final code
            code += mapped, lastCode = mapped;

            // If the code length exceeds the specified limit, exit early
            if ( this.exitEarly( code, i ) ) break;

        }

        // Return the adjusted phonetic code
        return this.adjustCode( code, chars );

    }

    /**
     * Converts a character to its phonetic code based on the mapping and rules.
     * 
     * @param {string} char - The current character
     * @param {number} i - The current position within the word
     * @param {string[]} chars - The word as an array of characters
     * @param {number} charLen - The total length of the word
     * @param {string|null} lastCode - The last code generated (to avoid duplicates)
     * @param {Record<string, string>} map - The phonetic mapping
     * @returns {string|undefined} - The phonetic code or undefined if no code applies
     */
    protected mapChar (
        char: string, i: number, chars: string[], charLen: number,
        lastCode: string | null, map: Record<string, string>
    ) : string | undefined {

        const { dedupe = true } = this.options;

        // Apply phonetic rules to the character
        // If no rules apply, use the mapping
        // If the character is not in the mapping, return undefined
        const c = this.applyRules( char, i, chars, charLen ) ?? map[ char ] ?? undefined;

        // De-duplicate the code if necessary
        return dedupe && c === lastCode ? undefined : c;

    }

    /**
     * Ensures the phonetic code has a fixed length by padding or truncating.
     * 
     * @param {string} input - The input string to be adjusted
     * @returns {string} - The adjusted string with fixed length
     */
    protected equalLen ( input: string ) : string {

        const { length = -1, pad = '0' } = this.options;

        return length === -1 ? input : ( input + pad.repeat( length ) ).slice( 0, length );

    }

    /**
     * Converts a word into an array of characters.
     * 
     * @param {string} word - The input word to be converted
     * @returns {string[]} - An array of characters from the input word
     */
    protected word2Chars ( word: string ) : string[] {

        return word.toLowerCase().split( '' );

    }

    /**
     * Determines whether to exit early based on the current phonetic code length.
     * 
     * @param {string} code - The current phonetic code
     * @param {number} i - The current index in the word
     * @returns {boolean} - True if the code length exceeds the specified limit, false otherwise
     */
    protected exitEarly ( code: string, i: number ) : boolean {

        const { length = -1 } = this.options;

        return length > 0 && code.length >= length;

    }

    /**
     * Adjusts the phonetic code.
     * 
     * @param {string} code - The phonetic code to be adjusted
     * @param {string[]} chars - Characters to be removed from the code
     * @returns {string} - The adjusted phonetic code
     */
    protected adjustCode ( code: string, chars: string[] ) : string {

        return code;

    }

    /**
     * Processes an array of words to generate their phonetic indices.
     * 
     * This method iterates over each word, generates its phonetic code,
     * and ensures that the resulting codes are of equal length.
     * 
     * @param {string[]} words - An array of words to be processed
     * @returns {string[]} - An array of phonetic indices for the input words
     */
    protected loop ( words: string[] ) : string[] {

        const index: string[] = [];

        // Loop over each word in the input array
        for ( const word of words ) {

            // Get the phonetic code for the word
            const code: string = this.encode( word );

            // If a code is generated, add them to the index
            if ( code && code.length ) index.push( this.equalLen( code ) );

        }

        return index;

    }

    /**
     * Asynchronously processes an array of words to generate their phonetic indices.
     * 
     * This method iterates over each word, generates its phonetic code asynchronously,
     * and ensures that the resulting codes are of equal length.
     * 
     * @param {string[]} words - An array of words to be processed
     * @returns {Promise<string[]>} - A promise that resolves to an array of phonetic indices for the input words
     */
    protected async loopAsync ( words: string[] ) : Promise<string[]> {

        const index: string[] = [];

        // Loop over each word in the input array
        for ( const word of words ) {

            // Get the phonetic code for the word asynchronously
            const code: string = await Promise.resolve( this.encode( word ) );

            // If a code is generated, add them to the index
            if ( code && code.length ) index.push( this.equalLen( code ) );

        }

        return index;

    }

    /**
     * Generates a phonetic index for the given input string.
     * 
     * @param {string} input - The input string to be indexed
     * @returns {string[]} - An array of phonetic indices for the input words
     */
    public getIndex ( input: string ) : string[] {

        const { delimiter = ' ' } = this.options;

        // Split the input string by the specified delimiter and loop over it
        return this.loop( input.split( delimiter ).filter( Boolean ) ).filter( Boolean );

    }

    /**
     * Asynchronously generates a phonetic index for the given input string.
     * 
     * @param {string} input - The input string to be indexed
     * @returns {Promise<string[]>} - A promise that resolves to an array of phonetic indices for the input words
     */
    public async getIndexAsync ( input: string ) : Promise<string[]> {

        const { delimiter = ' ' } = this.options;

        // Split the input string by the specified delimiter and loop over it asynchronously
        return ( await this.loopAsync(
            input.split( delimiter ).filter( Boolean )
        ) ).filter( Boolean );

    }

}