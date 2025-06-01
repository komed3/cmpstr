/**
 * @fileoverview
 * 
 * This file exports various phonetic algorithms. Each metric is implemented
 * as a class that extends the Phonetic base class.
 * 
 * Phonetic algorithms:
 *  - Cologne
 *  - Soundex
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import Cologne from './Cologne';
import Soundex from './Soundex';

export const ALL_PHONETICS = {
    cologne: Cologne,
    soundex: Soundex
};