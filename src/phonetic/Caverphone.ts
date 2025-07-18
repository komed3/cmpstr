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
 * @module Phonetic/Caverphone
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticOptions } from '../utils/Types';
import { Phonetic, PhoneticRegistry, PhoneticMappingRegistry } from './Phonetic';

/**
 * Caverphone class extends the Phonetic class to implement the Caverphone phonetic algorithm.
 */
export class Caverphone extends Phonetic {

    // Default options for the Caverphone phonetic algorithm
    protected static override default: PhoneticOptions = {
        map: 'en1', delimiter: ' ', length: 10, pad: '1', dedupe: false
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
        word = word.replace( /[^A-Z]/gi, '' ).toLowerCase();

        // Use the base implementation for rule/mapping application
        return super.encode( word );

    }

}

// Register the Caverphone algorithm in the phonetic registry
PhoneticRegistry.add( 'caverphone', Caverphone );

// Register the Caverphone 1.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en1', {
    map: {
        b: 'p', c: 'k', d: 't', q: 'k', v: 'f', x: 'k', z: 's'
    },
    patterns: [
        { pattern: /^cough/, replace: 'cou2f' },
        { pattern: /^rough/, replace: 'rou2f' },
        { pattern: /^tough/, replace: 'tou2f' },
        { pattern: /^enough/, replace: 'enou2f' },
        { pattern: /^gn/, replace: '2n' },
        { pattern: /mb$/, replace: 'm2' }
    ],
    ruleset: [
        { char: 'c', next: [ 'q' ], code: '2' },
        { char: 'c', next: [ 'i', 'e', 'y' ], code: 's' },
        { char: 't', next: [ 'c' ], next2: [ 'h' ], code: '2' },
        { char: 'd', next: [ 'g' ], code: '2' },
        { char: 't', next: [ 'i' ], next2: [ 'a', 'o' ], code: 's' },
        { char: 'p', next: [ 'h' ], code: 'f' },
        { char: 'h', prev: [ 's' ], code: '2' },
    ]
} );

// Register the Caverphone 2.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en2', {
    map: {},
    ruleset: []
} );
