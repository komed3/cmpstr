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

}

// Register the Caverphone algorithm in the phonetic registry
PhoneticRegistry.add( 'caverphone', Caverphone );

// Register the Caverphone 1.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en1', {
    map: {},
    ruleset: []
} );

// Register the Caverphone 2.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en2', {
    map: {},
    ruleset: []
} );
