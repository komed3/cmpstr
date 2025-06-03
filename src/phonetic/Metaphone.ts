/**
 * Metaphone Phonetic Algorithm
 * src/phonetic/Metaphone.ts
 * 
 * @see https://en.wikipedia.org/wiki/Metaphone
 * @see https://gist.github.com/Rostepher/b688f709587ac145a0b3
 * 
 * Metaphone is a phonetic algorithm for indexing words by their English pronunciation.
 * It encodes words into a string of consonant symbols, allowing for the comparison of
 * words based on their pronunciation rather than their spelling. Metaphone is more
 * accurate than Soundex for English and is widely used in search, spell-checking,
 * and fuzzy matching.
 * 
 * This implementation uses a mapping and a comprehensive ruleset to efficiently
 * transform input words into their Metaphone code. The algorithm drops or transforms
 * letters according to context-sensitive rules, and only retains vowels at the start.
 * 
 * @module Phonetic/Metaphone
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticMapping, PhoneticOptions } from '../utils/Types';
import { Phonetic, PhoneticRegistry } from './Phonetic';

/**
 * Metaphone class extends the Phonetic class to implement the Metaphone phonetic algorithm.
 */
export class Metaphone extends Phonetic {

    // Default options for the Metaphone phonetic algorithm
    protected static override default: PhoneticOptions = {
        map: 'en', delimiter: ' ', length: -1, pad: '', dedupe: false
    };

    // Mappings for the Metaphone phonetic algorithm
    protected static override mappings: PhoneticMapping = {
        en: {
            map: {
                a: 'A', b: 'B', c: 'K', d: 'T', e: 'E', f: 'F',
                g: 'K', h: 'H', i: 'I', j: 'J', k: 'K',
                l: 'L', m: 'M', n: 'N', o: 'O', p: 'P', q: 'K',
                r: 'R', s: 'S', t: 'T', u: 'U', v: 'F', w: 'W',
                x: 'KS', y: 'Y', z: 'S'
            },
            ruleset: [
                // Drop the first letter if the string begins with `AE`, `GN`, `KN`, `PN` or `WR`
                { char: 'a', position: 'start', next: [ 'e' ], code: '' },
                { char: 'g', position: 'start', next: [ 'n' ], code: '' },
                { char: 'k', position: 'start', next: [ 'n' ], code: '' },
                { char: 'p', position: 'start', next: [ 'n' ], code: '' },
                { char: 'w', position: 'start', next: [ 'r' ], code: '' },
                // Drop `B` if after `M` at the end of the string
                { char: 'b', position: 'end', prev: [ 'm' ], code: '' },
                // `C` transforms into `X` if followed by `H` or `IA`
                { char: 'c', next: [ 'h' ], prevNot: [ 's' ], code: 'X' },
                { char: 'c', next: [ 'i' ], next2: [ 'a' ], code: 'X' },
                // `C` transforms into `S` if followed by `E`, `I` or `Y`
                { char: 'c', next: [ 'e', 'i', 'y' ], code: 'S' },
                // `D` transforms into `J` if followed by `GE`, `GI` or `GY`
                { char: 'd', next: [ 'g' ], next2: [ 'e', 'i', 'y' ], code: 'J' },
                // Drop `G` if followed by `H` and `H` is not at the end or before a vowel
                { char: 'g', next: [ 'h' ], next2Not: [ '', 'a', 'e', 'i', 'o', 'u' ], code: '' },
                // Drop `G` if followed by `N` or `NED` and is at the end of the string
                { char: 'g', trailing: 'n', code: '' },
                { char: 'g', trailing: 'ned', code: '' },
                // `G` transforms into `J` if before `E`, `I` or `Y` and is not a `GG`
                { char: 'g', next: [ 'e', 'i', 'y' ], prevNot: [ 'g' ], code: 'J' },
                // Drop `H` if after a vowel and not before a vowel
                { char: 'h', prev: [ 'a', 'e', 'i', 'o', 'u' ], nextNot: [ 'a', 'e', 'i', 'o', 'u' ], code: '' },
                // Drop `H` if after `C`, `G`, `P`, `S` or `T`
                { char: 'h', prev: [ 'c', 'g', 'p', 's', 't' ], code: '' },
                // Drop `K` if after `C`
                { char: 'k', prev: [ 'c' ], code: '' },
                // `PH` transforms into `F`
                { char: 'p', next: [ 'h' ], code: 'F' },
                // `S` transforms into `X` if followed by `H`, `IA` or `IO`
                { char: 's', next: [ 'h' ], code: 'X' },
                { char: 's', next: [ 'i' ], next2: [ 'a', 'o' ], code: 'X' },
                // `T` transforms into `X` if followed by `IA` or `IO`
                { char: 't', next: [ 'i' ], next2: [ 'a', 'o' ], code: 'X' },
                // `TH` transforms into `0` (zero)
                { char: 't', next: [ 'h' ], code: '0' },
                // Drop `T` if followed by `CH`
                { char: 't', next: [ 'c' ], next2: [ 'h' ], code: '' },
                // Drop `W` if not followed by a vowel
                { char: 'w', nextNot: [ 'a', 'e', 'i', 'o', 'u' ], code: '' },
                // `WH` transforms into `W` if at the beginning of the string
                { char: 'h', leading: 'w', code: '' },
                // `X` transforms into `S` if at the beginning
                { char: 'x', position: 'start', code: 'S' },
                // Drop `Y` if not followed by a vowel
                { char: 'y', nextNot: [ 'a', 'e', 'i', 'o', 'u' ], code: '' }
            ]
        }
    };

    /**
     * Constructor for the Metaphone class.
     * 
     * Initializes the Metaphone phonetic algorithm with the mapping and options.
     * 
     * @param {PhoneticOptions} [options] - Options for the Metaphone phonetic algorithm
     */
    constructor ( options: PhoneticOptions = {} ) { super ( options ) }

    /**
     * Generates the Metaphone code for a given word.
     * 
     * @param {string} word - The input word to be converted into a Metaphone code
     * @returns {string} - The generated Metaphone code
     */
    protected override encode ( word: string ) : string {

        // Remove duplicate adjacent letters except for C
        word = word.replace( /([A-BD-Z])\1+/gi, ( m, c ) => c === 'C' ? m : c );

        // Use the base implementation for rule/mapping application
        return super.encode( word );

    }

    /**
     * Adjusts the Metaphone code by removing vowels except for the first letter.
     * 
     * @param {string} code - The Metaphone code to be adjusted
     * @returns {string} - The adjusted Metaphone code
     */
    protected override adjustCode ( code: string ) : string {

        // Remove vowels except for the first letter
        return code.slice( 0, 1 ) + code.slice( 1 ).replace( /[AEIOU]/g, '' );

    }

}

// Register the Metaphone algorithm in the phonetic registry
PhoneticRegistry.add( 'metaphone', Metaphone );