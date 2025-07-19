/**
 * New York State Identification and Intelligence System
 * src/phonetic/NYSIIS.ts
 * 
 * @see https://en.wikipedia.org/wiki/NYSIIS
 * 
 * ...
 * 
 * @module Phonetic/NYSIIS
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticOptions } from '../utils/Types';
import { Phonetic, PhoneticRegistry, PhoneticMappingRegistry } from './Phonetic';

/**
 * NYSIIS class extends the Phonetic class to implement the NYSIIS phonetic algorithm.
 */
export class NYSIIS extends Phonetic {

    // Default options for the NYSIIS phonetic algorithm
    protected static override default: PhoneticOptions = {
        map: 'en', delimiter: ' ', length: -1, pad: '', dedupe: false
    };

    /**
     * Constructor for the NYSIIS class.
     * 
     * Initializes the NYSIIS phonetic algorithm with the mapping and options.
     * 
     * @param {PhoneticOptions} [opt] - Options for the NYSIIS phonetic algorithm
     */
    constructor ( opt: PhoneticOptions = {} ) { super ( 'nysiis', opt ) }

}

// Register the NYSIIS algorithm in the phonetic registry
PhoneticRegistry.add( 'nysiis', NYSIIS );

// Register the NYSIIS phonetic mapping for English
PhoneticMappingRegistry.add( 'nysiis', 'en', {
    map: {},
    patterns: [
        // Special word-initial replacements
        { pattern: /^MAC/, replace: 'MCC' },
        { pattern: /^KN/, replace: 'NN' },
        { pattern: /^K/, replace: 'C' },
        { pattern: /^PH|^PF/, replace: 'FF' },
        { pattern: /^SCH/, replace: 'SSS' },
        // Special word-final replacement
        { pattern: /EE$|IE$/, replace: 'Y␢' },
        { pattern: /DT$|RT$|RD$|NT$|ND$/, replace: 'D␢' }
    ]
} );
