/**
 * Soundex Phonetic Algorithm
 * 
 * @see https://en.wikipedia.org/wiki/Soundex
 * 
 * Soundex is a phonetic algorithm for indexing names by sound. It is used to encode words
 * into a phonetic representation, allowing for the comparison of words based on their
 * pronunciation rather than their spelling. This works by mapping letters to digits,
 * ignoring certain letters, and applying specific rules to handle character combinations.
 * 
 * It is particularly useful for matching names that may be spelled differently but sound
 * similar and commonly used in genealogical research and databases to find similar-sounding
 * names.
 * 
 * This implementation supports multiple mappings, including English, German, and Cologne
 * dialects. The algorithm processes each word in the input, applies the phonetic mapping,
 * and returns an array of phonetic codes. The Soundex algorithm is not case-sensitive and
 * ignores vowels and certain consonants. It outputs an array of strings that represents
 * the phonetic code of the input, typically limited to a specific length.
 * 
 * This implementation is designed to be efficient and easy to use, with options for
 * customizing the phonetic mapping and output length.
 * 
 * @module Metric/Phonetic/Soundex
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import { PhoneticMapping, MetricInput, MetricOptions } from '../utils/Types';
import { Phonetic } from './Phonetic';

/**
 * Soundex class extends the Phonetic class to implement the Soundex phonetic algorithm.
 */
export default class Soundex extends Phonetic {

    /**
     * Soundex phonetic mapping.
     * 
     * This mapping is used to convert words into their phonetic representation
     * based on the Soundex algorithm. It is pre-defined for English, German, and
     * Cologne dialects. Each character is mapped to a digit, with some characters
     * being ignored. The rules define how certain character combinations are
     * handled.
     */
    protected static override mapping: PhoneticMapping = {
        en: {
            map: {
                a: '0', e: '0', h: '0', i: '0', o: '0', u: '0', w: '0', y: '0',
                b: '1', f: '1', p: '1', v: '1',
                c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
                d: '3', t: '3', l: '4', m: '5', n: '5', r: '6',
            }
        },
        de: {
            map: {
                a: '0', ä: '0', e: '0', h: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', f: '1', p: '1', v: '1', w: '1',
                c: '2', g: '2', k: '2', q: '2', s: '2', ß: '2', x: '2', z: '2',
                d: '3', t: '3', l: '4', m: '5', n: '5', r: '6',
            }
        },
        cologne: {
            map: {
                a: '0', ä: '0', e: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', p: '1', d: '2', t: '2', f: '3', v: '3', w: '3',
                g: '4', k: '4', q: '4', l: '5', m: '6', n: '6', r: '7',
                c: '8', s: '8', ß: '8', z: '8', x: '48'
            },
            ignore: [ 'h' ],
            rules: [
                { char: 'p', next: [ 'h' ], code: '3' },
                { char: 'd', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 't', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 'x', prev: [ 'c', 'k', 'q' ], code: '8' },
                { char: 'c', prev: [ 's', 'z' ], code: '8' },
                { char: 'c', position: 'start', next: [ 'a', 'h', 'k', 'l', 'o', 'q', 'r', 'u', 'x' ], code: '4' },
                { char: 'c', next: [ 'a', 'h', 'k', 'o', 'q', 'u', 'x' ], prevNot: [ 's', 'z' ], code: '4' }
            ]
        }
    };

    /**
     * Constructor for the Soundex class.
     * 
     * Initializes the Soundex class with two input strings or
     * arrays of strings and optional options.
     * 
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     */
    constructor (
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        // Call the parent Phonetic constructor with the metric name and inputs
        super ( 'soundex', a, b, options );

    }

    /**
     * Computes the phonetic index for the given input string.
     * 
     * This method processes the input string, applies the Soundex phonetic
     * mapping, and returns an array of phonetic codes for each word in the input.
     * 
     * @param {string} input - The input string to process
     * @returns {string[]} - An array of phonetic codes
     */
    protected override phoneticIndex ( input: string ) : string[] {

        // Get options with defaults
        const { delimiter = ' ', phonetic: { mapping = 'en', length = 4 } = {} } = this.options;

        // Get the mapping for the specified language, fallback to Englisch
        const { map, ignore = [], rules = [] } = Soundex.mapping[ mapping ] ?? Soundex.mapping.en;

        const index: string[] = [];

        // Split the input into words using the specified delimiter
        for ( const word of input.split( delimiter ).filter( Boolean ) ) {

            // Split the word into characters, convert to lowercase, and initialize variables
            const chars: string[] = word.toLowerCase().split( '' );
            const charLast: number = chars.length - 1;

            let code: string = '';
            let lastCode: string | null = null;

            // Iterate over each character in the word (excluding the first one)
            for ( let i = 1; i <= charLast; i++ ) {

                const char: string = chars[ i ];

                // Skip characters that are in the ignore list
                if ( ignore.includes( char ) ) continue;

                // Get the previous and next characters, defaulting to empty string if out of bounds
                const prev: string = chars[ i - 1 ] || '';
                const next: string = chars[ i + 1 ] || '';
                let c: string = map[ char ] || '';

                // Check for rules that apply to the current character
                for ( const rule of rules ) {

                    if ( rule.char !== char ) continue;

                    // Check if the rule applies based on position
                    if ( rule.position === 'start' && i !== 0 ) continue;
                    if ( rule.position === 'end' && i !== charLast ) continue;

                    // Check if the previous and next characters match the rule
                    if ( rule.prev && ! rule.prev.includes( prev ) ) continue;
                    if ( rule.prevNot && rule.prevNot.includes( prev ) ) continue;

                    // Check if the next character matches the rule
                    if ( rule.next && ! rule.next.includes( next ) ) continue;
                    if ( rule.nextNot && rule.nextNot.includes( next ) ) continue;

                    c = rule.code;
                    break;

                }

                // Skip if the character code is empty or the same as the last one
                if ( ! c || c === lastCode ) continue;

                // Add the last character code to the phonetic code
                code += c.replace( /\D/g, '' ), lastCode = c;

            }

            // Build the final phonetic code
            code = chars[ 0 ].toUpperCase() + code.replaceAll( '0', '' );

            // Add the phonetic code to the index, ensuring it has the specified length
            index.push( length === -1 ? code : (
                ( code + '0'.repeat( length ) ).slice( 0, length )
            ) );

        }

        return index;

    }

}