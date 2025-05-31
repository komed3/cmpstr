/**
 * Metaphone Phonetic Algorithm
 * src/phonetic/Metaphone
 * 
 * @see https://en.wikipedia.org/wiki/Metaphone
 * 
 * Metaphone is a phonetic algorithm for indexing words by their (English) pronunciation. It
 * improves upon Soundex by using more sophisticated rules for English spelling and pronunciation.
 * As with Soudex, similar-sounding words are encoded to the same representation, allowing for
 * the comparison of words based on their phonetic representation rather than their spelling.
 * 
 * Later, Metaphone was superseded by Double Metaphone, which supports multiple pronunciations
 * of the same word, but this implementation focuses on the original Metaphone algorithm.
 * 
 * This implementation is designed for maximal performance and memory efficiency, using a
 * simple mapping and a compact rule engine.
 * 
 * @module Phonetic/Metaphone
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticMapping, PhoneticOptions } from '../utils/Types';
import { Phonetic } from './Phonetic';

/**
 * Metaphone class extends the Phonetic class to implement the Metaphone phonetic algorithm.
 */
export default class Metaphone extends Phonetic {

    /**
     * Metaphone phonetic mapping.
     * 
     * This mapping is used to convert words into their phonetic representation
     * based on the Metaphone algorithm. It is pre-defined for English dialects.
     * Characters are mapped to phonetic codes, and specific rules are applied
     * to handle character combinations and special cases.
     */
    protected static override mapping: PhoneticMapping = {
        en: {
            map: {
                a: '', e: '', h: '', i: '', o: '', u: '', w: '', y: '',
                b: 'B', c: 'K', d: 'T', f: 'F', g: 'K', j: 'J', k: 'K',
                l: 'L', m: 'M', n: 'N', p: 'F', q: 'K', r: 'R', s: 'S',
                t: 'T', v: 'F', x: 'KS', z: 'S'
            },
            rules: [
                { char: 'k', next: [ 'n' ], code: '' },
                { char: 'p', next: [ 'h' ], code: 'F' },
                { char: 'g', next: [ 'h' ], code: '' },
                { char: 'c', next: [ 'h' ], code: 'X' },
                { char: 's', next: [ 'h' ], code: 'X' },
                { char: 't', next: [ 'h' ], code: '0' },
                { char: 'd', next: [ 'g', 'j' ], code: 'J' },
                { char: 'w', next: [ 'r' ], code: 'R' },
                { char: 'x', code: 'KS' }
            ]
        }
    };

    /**
     * Computes the phonetic index for the given input string.
     * 
     * This method processes the input string, applies the Metaphone phonetic
     * mapping, and returns an array of phonetic codes for each word.
     * 
     * @param {string} input - The input string to process
     * @param {PhoneticOptions} options - Optional parameters for phonetic processing
     * @returns {string[]} - An array of phonetic codes
     */
    public static getIndex ( input: string, options: PhoneticOptions = {} ) : string[] {

        // Get options with defaults
        const { mapping = 'en', delimiter = ' ', length = -1 } = options;

        // Get the mapping for the specified language, fallback to Englisch
        const { map, rules = [] } = this.mapping[ mapping ] ?? this.mapping.en;

        const index: string[] = [];

        // Split the input into words using the specified delimiter
        for ( const word of input.split( delimiter ).filter( Boolean ) ) {

            // Split the word into characters, convert to lowercase, and initialize variables
            const chars: string[] = word.toLowerCase().split( '' );

            // Initialize the phonetic code and last code variables
            let code: string = '', lastCode: string | null = null;

            // Loop through characters; i will be incremented by 1 or 2 depending on the rule
            for ( let i = 0; i < chars.length; ) {

                // Get the character at the current position
                const char: string = chars[ i ];

                // Apply phonetic rules to the character
                const ruleCode: string | undefined = this.applyRules( char, i, chars, rules );
                const mapped: string = ruleCode ?? map[ char ] ?? '';

                // Dedupe consecutive characters
                if ( mapped && mapped !== lastCode ) {

                    code += mapped;
                    lastCode = mapped;

                }

                // Advance by rule length if rule matched, else by 1
                i += ( ruleCode && rules.find(
                    ( r ) => r.char === char && r.next && r.next.includes( chars[ i + 1 ] || '' )
                ) ) ? 2 : 1;

            }

            // Add the phonetic code to the index, ensuring it has the specified length
            index.push( length === -1 ? code.toUpperCase() : (
                ( code.toUpperCase() + '0'.repeat( length ) ).slice( 0, length )
            ) );

        }

        return index;

    }

}