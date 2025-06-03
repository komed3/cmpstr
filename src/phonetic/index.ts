/**
 * Phonetic Registry Loader
 * src/phonetic/index.ts
 *
 * This module serves as the central loader and registry for all phonetic algorithms
 * available in the CmpStr library. It ensures that all phonetic implementations are
 * registered with the PhoneticRegistry and available for use throughout the application.
 * 
 * Each phonetic algorithm (such as Soundex, Cologne, Metaphone, etc.) is defined in
 * its own module and is automatically registered with the PhoneticRegistry upon import.
 * This design allows for easy extensibility: new phonetic algorithms can be added simply
 * by creating a new module and importing it here. The registry pattern enables dynamic
 * lookup, instantiation, and management of all available phonetic algorithms at runtime.
 * 
 * Features:
 *  - Centralized registration of all built-in phonetic algorithms
 *  - Automatic registration via side-effect imports
 *  - Extensible: custom phonetic algorithms can be registered at runtime via the PhoneticRegistry API
 *  - Consistent interface for accessing, listing, and managing phonetic algorithms
 *  - Ensures that all phonetic algorithms are available for use in the CmpStr API and utilities
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import './Cologne';
import './Metaphone';
import './Soundex';

export { PhoneticRegistry } from './Phonetic';