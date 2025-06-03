/**
 * Cologne Phonetic Algorithm
 * src/phonetic/Cologne.ts
 * 
 * @see https://en.wikipedia.org/wiki/Cologne_phonetics
 * 
 * Cologne phonetics, also known as `Kölner Phonetik` or the `Cologne process`,
 * is a phonetic algorithm that assigns a sequence of digits, referred to as the
 * phonetic code, to words. The purpose of this method is to ensure that words
 * with identical sounds receive the same code. This algorithm can facilitate a
 * similarity search among words.
 * 
 * Cologne phonetics is associated with the well-known Soundex phonetic algorithm,
 * yet it is specifically optimized for the German language. This algorithm was
 * introduced by Hans Joachim Postel in 1969.
 * 
 * The Cologne phonetic algorithm works by mapping letters to digits, ignoring
 * certain letters, and applying specific rules to handle character combinations.
 * 
 * @module Phonetic/Cologne
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PhoneticMapping, PhoneticOptions } from '../utils/Types';
import { Phonetic, PhoneticRegistry } from './Phonetic';

/**
 * Cologne class extends the Phonetic class to implement the Cologne phonetic algorithm.
 */
export default class Cologne extends Phonetic {

    // Default options for the Cologne phonetic algorithm
    protected static override default: PhoneticOptions = {
        map: 'cologne', delimiter: ' ', length: -1, dedupe: true
    };

    // Mappings for the Cologne phonetic algorithm
    protected static override mappings: PhoneticMapping = {
        cologne: {
            map: {
                a: '0', ä: '0', e: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', p: '1',
                d: '2', t: '2',
                f: '3', v: '3', w: '3',
                g: '4', k: '4', q: '4',
                l: '5',
                m: '6', n: '6',
                r: '7',
                c: '8', s: '8', ß: '8', z: '8',
                x: '48'
            },
            ignore: [ 'h' ],
            ruleset: [
                { char: 'p', next: [ 'h' ], code: '3' },
                { char: 'c', position: 'start', next: [ 'a', 'h', 'k', 'l', 'o', 'q', 'r', 'u', 'x' ], code: '4' },
                { char: 'c', next: [ 'a', 'h', 'k', 'o', 'q', 'u', 'x' ], prevNot: [ 's', 'z' ], code: '4' },
                { char: 'd', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 't', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 'x', prev: [ 'c', 'k', 'q' ], code: '8' }
            ]
        }
    };

    /**
     * Constructor for the Cologne class.
     * 
     * Initializes the Cologne phonetic algorithm with the mapping and options.
     * 
     * @param {PhoneticOptions} [options] - Options for the Cologne phonetic algorithm
     */
    constructor ( options: PhoneticOptions = {} ) { super ( options ) }

    /**
     * Adjusts the phonetic code by removing all '0's except the first character.
     * 
     * @param {string} code - The phonetic code to adjust
     * @returns {string} - The adjusted phonetic code
     */
    protected override adjustCode ( code: string ) : string {

        return code.slice( 0, 1 ) + code.slice( 1 ).replaceAll( '0', '' );

    }

}

// Register the Cologne algorithm in the phonetic registry
PhoneticRegistry.add( 'cologne', Cologne );