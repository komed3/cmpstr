/**
 * @fileoverview
 * 
 * This file exports various phonetic algorithms for creating indices. Each algorithm
 * is implemented as a class that extends the Phonetic base class.
 * 
 * Included algorithms:
 *  - Metaphone
 *  - Soundex
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import Metaphone from './Metaphone';
import Soundex from './Soundex';

export const ALL_PHONETICS = {
    metaphone: Metaphone,
    soundex: Soundex
};