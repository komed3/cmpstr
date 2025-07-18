/**
 * Caverphone Phonetic Algorithm
 * src/phonetic/Caverphone.ts
 * 
 * @see https://en.wikipedia.org/wiki/Caverphone
 * 
 * ...
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

        // Apply specific Caverphone rules
        for ( const [ s, r ] of [
            [ /^cough/, 'cou2f' ], [ /^rough/, 'rou2f' ],
            [ /^tough/, 'tou2f' ], [ /^enough/, 'enou2f' ],
            [ /^gn/, '2n' ], [ /mb$/, 'm2' ]
        ] as [ RegExp, string ][] ) {

            word = word.replace( s, r );

        }

        // Use the base implementation for rule/mapping application
        return super.encode( word );

    }

}

// Register the Caverphone algorithm in the phonetic registry
PhoneticRegistry.add( 'caverphone', Caverphone );

// Register the Caverphone 1.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en1', {
    map: {},
    ruleset: [
        { char: 'c', next: [ 'q' ], code: '2q' }
    ]
} );

// Register the Caverphone 2.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en2', {
    map: {},
    ruleset: []
} );
