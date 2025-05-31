/**
 * Abstract Phonetic
 * src/phonetic/Phonetic.ts
 * 
 * @see https://en.wikipedia.org/wiki/Phonetic_algorithm
 * 
 * A phonetic algorithm refers to a method for indexing words according to their pronunciation.
 * When the algorithm relies on orthography, it is significantly influenced by the spelling
 * conventions of the language for which it is intended: since the majority of phonetic algorithms
 * were created for English, they tend to be less effective for indexing words in other languages.
 * Phonetic search has numerous applications, and one of the initial use cases has been in
 * trademark searches to verify that newly registered trademarks do not pose a risk of
 * infringing upon existing trademarks due to their pronunciation.
 * 
 * This module provides an abstract class for generating phonetic indices based on mappings
 * and rules. It allows for the implementation of various phonetic algorithms by extending
 * the abstract class.
 * 
 * @module Phonetic
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticMapping, PhoneticMap, PhoneticRule, PhoneticOptions } from '../utils/Types';

/**
 * Abstract class representing a phonetic metric.
 * 
 * @abstract
 */
export abstract class Phonetic {

    /**
     * Phonetic mapping used for phonetic algorithms.
     * 
     * This mapping is used to convert words into their phonetic representation
     * based on the specific phonetic algorithm implemented in the subclass.
     */
    protected static mapping: PhoneticMapping;

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
     * @param {PhoneticRule[]} rules - The ruleset from the mapping
     * @returns {string|undefined} - The rule code or undefined if no rule applies
     */
    protected static applyRules (
        char: string, i: number, chars: string[],
        rules: PhoneticRule[]
    ) : string | undefined {

        // If no rules are provided, return undefined
        if ( ! rules || ! rules.length ) return undefined;

        // Get the previous, next, and surrounding characters
        const prev: string = chars[ i - 1 ] || '', prev2: string = chars[ i - 2 ] || '';
        const next: string = chars[ i + 1 ] || '', next2: string = chars[ i + 2 ] || '';

        // Iterate over the rules to find a matching rule for the current character
        for ( const rule of rules ) {

            // Skip if the rule does not match the current character
            if ( rule.char && rule.char !== char ) continue;

            // Position in the word (start, end, middle)
            if ( rule.position === 'start' && i !== 0 ) continue;
            if ( rule.position === 'end' && i !== chars.length - 1 ) continue;
            if ( rule.position === 'middle' && 0 < i && i > chars.length - 1 ) continue;

            // Previous character (i-1)
            if ( rule.prev && ! rule.prev.includes( prev ) ) continue;
            if ( rule.prevNot && rule.prevNot.includes( prev ) ) continue;

            // Preceding character (i-2)
            if ( rule.prev2 && ! rule.prev2.includes( prev2 ) ) continue;
            if ( rule.prev2Not && rule.prev2Not.includes( prev2 ) ) continue;

            // Next character (i+1)
            if ( rule.next && ! rule.next.includes( next ) ) continue;
            if ( rule.nextNot && rule.nextNot.includes( next ) ) continue;

            // Upcoming character (i+2)
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
     * Pads the input string to a specified length with a given character.
     * 
     * This method ensures that the input string is of a certain length by padding it
     * with the specified character. If the input string is longer than the specified
     * length, it will be truncated.
     * 
     * @param {string} input - The input string to pad
     * @param {number} length - The desired length of the output string (default: -1, no padding)
     * @param {string} pad - The character to use for padding (default: '0')
     * @returns {string} - The padded or truncated string
     */
    protected static equalLen ( input: string, length: number = -1, pad: string = '0' ) : string {

        return length === -1 ? input : ( input + pad.repeat( length ) ).slice( 0, length );

    }

    /**
     * Generates a phonetic code for a given array of characters based on the provided mapping.
     * 
     * This method processes the characters according to the phonetic mapping rules and returns
     * a phonetic code string. It supports various options such as ignoring certain characters,
     * deduplication, and handling the first character in different ways.
     * 
     * @param {string[]} chars - The array of characters to process
     * @param {PhoneticMap} mapping - The phonetic mapping to use
     * @returns {string} - The generated phonetic code
     */
    protected static getCode ( chars: string[], mapping: PhoneticMap ) : string {

        // Get the mapping options
        const { map = {}, ignore = [], firstChar = 'map', dedupe = true, rules = [] } = mapping;

        // Initialize the phonetic code and last code variables
        let code: string = '', lastCode: string | null = null;

        // Loop through characters
        for ( let i = 0; i < chars.length; i++ ) {

            // Get the character at the current position
            const char: string = chars[ i ];

            // Skip characters that are in the ignore list
            if ( ignore.includes( char ) ) continue;

            // Map the char to its phonetic code
            const c: string | undefined = this.applyRules( char, i, chars, rules ) ?? map[ char ] ?? undefined;

            // Skip if the character code is empty or the same as the last one
            if ( c === undefined || ( dedupe && c === lastCode ) ) continue;

            // Add the last character code to the phonetic code
            code += c, lastCode = c;

        }

        // Build the final phonetic code based on the given mode
        switch ( firstChar ) {

            // Keep the first letter
            case 'letter': return chars[ 0 ] + code.slice( 1 ).replaceAll( '0', '' );
            // Map every char within the word
            case 'map': return code.replaceAll( '0', '' );
            // Keep the "0" at the start
            case 'keep0': return code[ 0 ] + code.slice( 1 ).replaceAll( '0', '' );

        }

    }

    /**
     * Computes the phonetic index for the given input string.
     * 
     * This method processes the input string, applies the phonetic mapping,
     * and returns an array of phonetic codes for each word.
     * 
     * @param {string} input - The input string to process
     * @param {PhoneticOptions} options - Optional parameters for phonetic processing
     * @returns {string[]} - An array of phonetic codes for each word in the input
     */
    public static getIndex ( input: string, options: PhoneticOptions = {} ) : string[] {

        // Get options with defaults
        const { mapping: lang = 'en', delimiter = ' ', pad = '0', length = -1 } = options;

        // Get the mapping for the specified language, fallback to Englisch
        const mapping: PhoneticMap = this.mapping[ lang ] ?? this.mapping.en;

        // The array for storing the phonetic codes
        const index: string[] = [];

        // Split the input into words using the specified delimiter
        for ( const word of input.split( delimiter ).filter( Boolean ) ) {

            // Split the word into characters, converted to lowercase
            const chars: string[] = word.toLowerCase().split( '' );

            // Get the phonetic index of the word
            const code: string = this.getCode( chars, mapping );

            // Push the phonetic code to the index array
            if ( code && code.length ) index.push(
                this.equalLen( code, length, pad ).toUpperCase()
            );

        }

        // Return the phonetic index (remove empty)
        return index.filter( Boolean );

    }

    /**
     * Returns a list of supported phonetic mappings.
     *  
     * @returns {string[]} - An array of supported phonetic mappings
     */
    public static supportedMappings () : string[] {

        return Object.keys( this.mapping );

    }

    /**
     * Checks if a phonetic mapping exists for the given ID.
     * 
     * @param {string} id - The ID of the phonetic mapping to check
     * @returns {boolean} - True if the mapping exists, false otherwise
     */
    public static hasMapping ( id: string ) : boolean {

        return id in this.mapping;

    }

    /**
     * Adds a new phonetic mapping.
     * 
     * @param {string} id - The ID for the new phonetic mapping
     * @param {PhoneticMap} mapping - The phonetic mapping to add
     * @returns {boolean} - True if the mapping was added successfully, false if it already exists
     */
    public static addMapping ( id: string, mapping: PhoneticMap ) : boolean {

        if ( this.hasMapping( id ) ) return false;

        this.mapping[ id ] = mapping;

        return true;

    }

    /**
     * Deletes a phonetic mapping by its ID.
     * 
     * @param {string} id - The ID of the phonetic mapping to delete
     * @returns {boolean} - True if the mapping was deleted successfully, false if it does not exist
     */
    public static deleteMapping ( id: string ) : boolean {

        if ( ! this.hasMapping( id ) ) return false;

        delete this.mapping[ id ];

        return true;

    }

}