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

import type { PhoneticMapping } from '../utils/Types';
import { Phonetic } from './Phonetic';

/**
 * Metaphone class extends the Phonetic class to implement the mapping.
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

}