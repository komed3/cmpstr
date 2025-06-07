/**
 * Soundex Phonetic Algorithm
 * src/phonetic/Soudex.ts
 * 
 * @see https://en.wikipedia.org/wiki/Soundex
 * 
 * Soundex is a phonetic algorithm for indexing names by sound. It is used to
 * encode words into a phonetic representation, allowing for the comparison of
 * words based on their pronunciation rather than their spelling. This works
 * by mapping letters to digits, ignoring certain letters, and applying specific
 * rules to handle character combinations.
 * 
 * It is particularly useful for matching names that may be spelled differently
 * but sound similar and commonly used in genealogical research and databases
 * to find similar-sounding names.
 * 
 * The Soundex algorithm is not case-sensitive and ignores vowels and certain
 * consonants. It outputs an array of strings that represents the phonetic code
 * of the input, typically limited to the length of four characters.
 * 
 * @module Phonetic/Soundex
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticOptions } from '../utils/Types';
import { Phonetic, PhoneticRegistry, PhoneticMappingRegistry } from './Phonetic';

/**
 * Soundex class extends the Phonetic class to implement the Soundex phonetic algorithm.
 */
export class Soundex extends Phonetic {

    // Default options for the Soundex phonetic algorithm
    protected static override default: PhoneticOptions = {
        map: 'en', delimiter: ' ', length: 4, pad: '0', dedupe: true
    };

    /**
     * Constructor for the Soundex class.
     * 
     * Initializes the Soundex phonetic algorithm with the mapping and options.
     * 
     * @param {PhoneticOptions} [options] - Options for the Soundex phonetic algorithm
     */
    constructor ( options: PhoneticOptions = {} ) { super ( 'soundex', options ) }

    /**
     * Adjusts the phonetic code by removing leading zeros and ensuring the
     * first character is uppercase.
     * 
     * @param {string} code - The phonetic code to adjust
     * @param {string[]} chars - The characters used in the phonetic code
     * @returns {string} - The adjusted phonetic code
     */
    protected override adjustCode ( code: string, chars: string[] ) : string {

        return chars[ 0 ].toUpperCase() + code.slice( 1 ).replaceAll( '0', '' );

    }

}

// Register the Soundex algorithm in the phonetic registry
PhoneticRegistry.add( 'soundex', Soundex );

//Register the Soundex phonetic mapping for English.
PhoneticMappingRegistry.add( 'soundex', 'en', {
    map: {
        a: '0', e: '0', h: '0', i: '0', o: '0', u: '0', w: '0', y: '0',
        b: '1', f: '1', p: '1', v: '1',
        c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
        d: '3', t: '3', l: '4', m: '5', n: '5', r: '6'
    }
} );

//Register the Soundex phonetic mapping for German.
PhoneticMappingRegistry.add( 'soundex', 'de', {
    map: {
        a: '0', ä: '0', e: '0', h: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
        b: '1', f: '1', p: '1', v: '1', w: '1',
        c: '2', g: '2', k: '2', q: '2', s: '2', ß: '2', x: '2', z: '2',
        d: '3', t: '3', l: '4', m: '5', n: '5', r: '6'
    },
    ruleset: [
        { char: 'c', next: [ 'h' ], code: '7' }
    ]
} );