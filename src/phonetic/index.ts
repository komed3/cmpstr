/**
 * @fileoverview
 * 
 * This file exports various phonetic algorithms. Each metric is implemented
 * as a class that extends the Phonetic base class.
 * 
 * Phonetic algorithms:
 *  - Cologne
 *  - Metaphone
 *  - Soundex
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import Cologne from './Cologne';
import Metaphone from './Metaphone';
import Soundex from './Soundex';

export const PHONETICS = {
    cologne: Cologne,
    metaphone: Metaphone,
    soundex: Soundex
};