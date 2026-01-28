/**
 * Caverphone Phonetic Algorithm
 * src/phonetic/Caverphone.ts
 * 
 * @see https://en.wikipedia.org/wiki/Caverphone
 * 
 * This module implements the Caverphone phonetic algorithm, which is designed
 * to encode words into a phonetic representation. The Caverphone algorithm is
 * used primarily in New Zealand and was developed to assist in the indexing of
 * names in genealogical databases.
 * 
 * It converts words into a standardized phonetic code, allowing for variations
 * in spelling and pronunciation to be matched.
 * 
 * @module Phonetic
 * @name Caverphone
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticOptions } from '../utils/Types';

import { Phonetic, PhoneticMappingRegistry, PhoneticRegistry } from './Phonetic';

/**
 * Caverphone class extends the Phonetic class to implement the Caverphone phonetic algorithm.
 */
export class Caverphone extends Phonetic {

    /** Regular expressions used in the Caverphone algorithm */
    private static readonly REGEX = {
        uppercase: /[^A-Z]/gi
    };

    /** Default options for the Caverphone phonetic algorithm */
    protected static override default: PhoneticOptions = {
        map: 'en2', delimiter: ' ', length: -1, pad: '', dedupe: false
    };

    /**
     * Constructor for the Caverphone class.
     * 
     * Initializes the Caverphone phonetic algorithm with the mapping and options.
     * 
     * @param {PhoneticOptions} [opt] - Options for the Caverphone phonetic algorithm
     */
    constructor ( opt: PhoneticOptions = {} ) { super ( 'caverphone', opt ) }

    /**
     * Generates the Caverphone code for a given word.
     * 
     * @param {string} word - The input word to be converted into a Caverphone code
     * @returns {string} - The generated Caverphone code
     */
    protected override encode ( word: string ) : string {
        // Remove anything not A-Z and convert to lowercase
        word = word.replace( Caverphone.REGEX.uppercase, '' ).toLowerCase();

        // Use the base implementation for rule/mapping application
        return super.encode( word );
    }

    /**
     * Overrides the mapChar method to skip character mapping.
     * 
     * @param {string} char - The character to be mapped
     * @returns {string} - The mapped character
     */
    protected override mapChar = ( char: string ) : string => char;

    /**
     * Adjusts the phonetic code to uppercase.
     * 
     * @param {string} code - The phonetic code to adjust
     * @returns {string} - The adjusted phonetic code
     */
    protected override adjustCode = ( code: string ) : string => code.toUpperCase();

}

// Register the Caverphone algorithm in the phonetic registry
PhoneticRegistry.add( 'caverphone', Caverphone );

// Register the Caverphone 1.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en1', {
    options: { length: 6, pad: '1' },
    map: {},
    patterns: [
        // Special word-initial replacements
        { pattern: /^(c|r|t|en)ough/, replace: '$1ou2f' },
        { pattern: /^gn/, replace: '2n' },
        // Special word-final replacement
        { pattern: /mb$/, replace: 'm2' },
        // Character group replacements
        { pattern: /cq/g, replace: '2q' },
        { pattern: /c(e|i|y)/g, replace: 's$1' },
        { pattern: /tch/g, replace: '2ch' },
        { pattern: /[cqx]/g, replace: 'k' },
        { pattern: /v/g, replace: 'f' },
        { pattern: /dg/g, replace: '2g' },
        { pattern: /ti(a|o)/g, replace: 'si$1' },
        { pattern: /d/g, replace: 't' },
        { pattern: /ph/g, replace: 'fh' },
        { pattern: /b/g, replace: 'p' },
        { pattern: /sh/g, replace: 's2' },
        { pattern: /z/g, replace: 's' },
        // Vowel handling
        { pattern: /^[aeiou]/, replace: 'A' },
        { pattern: /[aeiou]/g, replace: '3' },
        // Special gh handling
        { pattern: /3gh3/g, replace: '3kh3' },
        { pattern: /gh/g, replace: '22' },
        // Single character replacements
        { pattern: /g/g, replace: 'k' },
        // Collapse repeated consonants
        { pattern: /s+/g, replace: 'S' },
        { pattern: /t+/g, replace: 'T' },
        { pattern: /p+/g, replace: 'P' },
        { pattern: /k+/g, replace: 'K' },
        { pattern: /f+/g, replace: 'F' },
        { pattern: /m+/g, replace: 'M' },
        { pattern: /n+/g, replace: 'N' },
        // Y and other single-letter handling
        { pattern: /j/g, replace: 'y' },
        // L/R/W/Y3 handling
        { pattern: /l3/g, replace: 'L3' },
        { pattern: /r3/g, replace: 'R3' },
        { pattern: /w3/g, replace: 'W3' },
        { pattern: /y3/g, replace: 'Y3' },
        // L/R/W followed by y
        { pattern: /ly/g, replace: 'Ly' },
        { pattern: /ry/g, replace: 'Ry' },
        { pattern: /wy/g, replace: 'Wy' },
        // WH handling
        { pattern: /wh3/g, replace: 'Wh3' },
        { pattern: /why/g, replace: 'Why' },
        // H at start
        { pattern: /^h/, replace: 'A' },
        // Remove certain letters
        { pattern: /[hlrwy23]/g, replace: '' }
    ]
} );

// Register the Caverphone 2.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en2', {
    options: { length: 10, pad: '1' },
    map: {},
    patterns: [
        // Remove trailing 'e'
        { pattern: /e$/, replace: '' },
        // Special word-initial replacements
        { pattern: /^(c|r|t|en|tr)ough/, replace: '$1ou2f' },
        { pattern: /^gn/, replace: '2n' },
        // Special word-final replacement
        { pattern: /mb$/, replace: 'm2' },
        // Character group replacements
        { pattern: /cq/g, replace: '2q' },
        { pattern: /c(e|i|y)/g, replace: 's$1' },
        { pattern: /tch/g, replace: '2ch' },
        { pattern: /[cqx]/g, replace: 'k' },
        { pattern: /v/g, replace: 'f' },
        { pattern: /dg/g, replace: '2g' },
        { pattern: /ti(a|o)/g, replace: 'si$1' },
        { pattern: /d/g, replace: 't' },
        { pattern: /ph/g, replace: 'fh' },
        { pattern: /b/g, replace: 'p' },
        { pattern: /sh/g, replace: 's2' },
        { pattern: /z/g, replace: 's' },
        // Vowel handling
        { pattern: /^[aeiou]/, replace: 'A' },
        { pattern: /[aeiou]/g, replace: '3' },
        // Y handling
        { pattern: /j/g, replace: 'y' },
        { pattern: /^y3/, replace: 'Y3' },
        { pattern: /^y/, replace: 'A' },
        { pattern: /y/g, replace: '3' },
        // Special gh handling
        { pattern: /3gh3/g, replace: '3kh3' },
        { pattern: /gh/g, replace: '22' },
        // Single character replacements
        { pattern: /g/g, replace: 'k' },
        // Collapse repeated consonants
        { pattern: /s+/g, replace: 'S' },
        { pattern: /t+/g, replace: 'T' },
        { pattern: /p+/g, replace: 'P' },
        { pattern: /k+/g, replace: 'K' },
        { pattern: /f+/g, replace: 'F' },
        { pattern: /m+/g, replace: 'M' },
        { pattern: /n+/g, replace: 'N' },
        // L/R/W3 handling
        { pattern: /l3/g, replace: 'L3' },
        { pattern: /r3/g, replace: 'R3' },
        { pattern: /w3/g, replace: 'W3' },
        { pattern: /wh3/g, replace: 'Wh3' },
        { pattern: /[lrw]$/, replace: '3' },
        // // H at start and final 3 handling
        { pattern: /^h/, replace: 'A' },
        { pattern: /3$/, replace: 'A' },
        // Remove certain letters
        { pattern: /[hlrw23]/g, replace: '' }
    ]
} );
