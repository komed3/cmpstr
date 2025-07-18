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
        word = word.replace( /[^A-Z]/gi, '' ).toLowerCase();

        // Use the base implementation for rule/mapping application
        return super.encode( word );

    }

}

// Register the Caverphone algorithm in the phonetic registry
PhoneticRegistry.add( 'caverphone', Caverphone );

// Register the Caverphone 1.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en1', {
    options: { length: 6, pad: '1' },
    map: {},
    patterns: [
        { pattern: /^cough/, replace: 'cou2f' },
        { pattern: /^rough/, replace: 'rou2f' },
        { pattern: /^tough/, replace: 'tou2f' },
        { pattern: /^enough/, replace: 'enou2f' },
        { pattern: /^gn/, replace: '2n' },
        { pattern: /mb$/, replace: 'm2' },
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
        { pattern: /^[aeiou]/, replace: 'A' },
        { pattern: /[aeiou]/g, replace: '3' },
        { pattern: /3gh3/g, replace: '3kh3' },
        { pattern: /gh/g, replace: '22' },
        { pattern: /g/g, replace: 'k' },
        { pattern: /s+/g, replace: 'S' },
        { pattern: /t+/g, replace: 'T' },
        { pattern: /p+/g, replace: 'P' },
        { pattern: /k+/g, replace: 'K' },
        { pattern: /f+/g, replace: 'F' },
        { pattern: /m+/g, replace: 'M' },
        { pattern: /n+/g, replace: 'N' },
        { pattern: /j/g, replace: 'y' },
        { pattern: /l3/g, replace: 'L3' },
        { pattern: /r3/g, replace: 'R3' },
        { pattern: /w3/g, replace: 'W3' },
        { pattern: /y3/g, replace: 'Y3' },
        { pattern: /ly/g, replace: 'Ly' },
        { pattern: /ry/g, replace: 'Ry' },
        { pattern: /wy/g, replace: 'Wy' },
        { pattern: /wh3/g, replace: 'Wh3' },
        { pattern: /why/g, replace: 'Why' },
        { pattern: /^h/, replace: 'A' },
        { pattern: /[hlrwy]/g, replace: '2' },
        { pattern: /[23]/g, replace: '' }
    ]
} );

// Register the Caverphone 2.0 phonetic mapping for English
PhoneticMappingRegistry.add( 'caverphone', 'en2', {
    options: { length: 10, pad: '1' },
    map: {},
    patterns: [
        { pattern: /e$/, replace: '' },
        { pattern: /^cough/, replace: 'cou2f' },
        { pattern: /^rough/, replace: 'rou2f' },
        { pattern: /^tough/, replace: 'tou2f' },
        { pattern: /^enough/, replace: 'enou2f' },
        { pattern: /^trough/, replace: 'trou2f' },
        { pattern: /^gn/, replace: '2n' },
        { pattern: /mb$/, replace: 'm2' },
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
        { pattern: /^[aeiou]/, replace: 'A' },
        { pattern: /[aeiou]/g, replace: '3' },
        { pattern: /j/g, replace: 'y' },
        { pattern: /^y3/, replace: 'Y3' },
        { pattern: /^y/, replace: 'A' },
        { pattern: /y/g, replace: '3' },
        { pattern: /3gh3/g, replace: '3kh3' },
        { pattern: /gh/g, replace: '22' },
        { pattern: /g/g, replace: 'k' },
        { pattern: /s+/g, replace: 'S' },
        { pattern: /t+/g, replace: 'T' },
        { pattern: /p+/g, replace: 'P' },
        { pattern: /k+/g, replace: 'K' },
        { pattern: /f+/g, replace: 'F' },
        { pattern: /m+/g, replace: 'M' },
        { pattern: /n+/g, replace: 'N' },
        { pattern: /l3/g, replace: 'L3' },
        { pattern: /r3/g, replace: 'R3' },
        { pattern: /w3/g, replace: 'W3' },
        { pattern: /wh3/g, replace: 'Wh3' },
        { pattern: /[lrw]$/, replace: '3' },
        { pattern: /[lrw]/g, replace: '2' },
        { pattern: /^h/, replace: 'A' },
        { pattern: /h/g, replace: '2' },
        { pattern: /3$/, replace: 'A' },
        { pattern: /[23]/g, replace: '' }
    ]
} );
