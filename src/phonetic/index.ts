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

import type { PhoneticMap, PhoneticMappingService } from '../utils/Types';
import { PhoneticRegistry } from './Phonetic';

/**
 * Phonetic Mapping Service
 * 
 * This service provides a simple interface to manage phonetic mappings
 * across different phonetic algorithms. It allows adding, removing,
 * checking existence, retrieving, and listing phonetic mappings
 * for specified algorithms.
 */
export function phoneticMap () : PhoneticMappingService {

    // Helper function to call methods on the PhoneticRegistry
    const callMethod = ( method: any, algo: string, ...args: any[] ) : any => (
        ( PhoneticRegistry.get( algo ) as any )[ method ]( ...args )
    );

    return {

        /**
         * Adds a phonetic mapping for a specific algorithm and ID.
         * 
         * @param {string} algo - The phonetic algorithm identifier (e.g., 'soundex', 'metaphone')
         * @param {string} id - The unique identifier for the mapping
         * @param {PhoneticMap} map - The phonetic map to be added, containing rules and mappings
         */
        add: ( algo: string, id: string, map: PhoneticMap ) => callMethod( 'addMapping', algo, id, map ),

        /**
         * Removes a phonetic mapping for a specific algorithm and ID.
         * 
         * @param {string} algo - The phonetic algorithm identifier
         * @param {string} id - The unique identifier for the mapping to be removed
         */
        remove: ( algo: string, id: string ) => callMethod( 'removeMapping', algo, id ),

        /**
         * Checks if a phonetic mapping exists for a specific algorithm and ID.
         * 
         * @param {string} algo - The phonetic algorithm identifier
         * @param {string} id - The unique identifier for the mapping to check
         * @returns {boolean} - Returns true if the mapping exists, false otherwise
         */
        has: ( algo: string, id: string ) : boolean => callMethod( 'hasMapping', algo, id ),

        /**
         * Retrieves a phonetic mapping for a specific algorithm and ID.
         * 
         * @param {string} algo - The phonetic algorithm identifier
         * @param {string} id - The unique identifier for the mapping to retrieve
         * @returns {PhoneticMap | undefined} - Returns the phonetic map if found, otherwise undefined
         */
        get: ( algo: string, id: string ) : PhoneticMap | undefined => callMethod( 'getMapping', algo, id ),

        /**
         * Lists all phonetic mappings for a specific algorithm.
         * 
         * @param {string} algo - The phonetic algorithm identifier
         * @returns {string[]} - Returns an array of mapping IDs for the specified algorithm
         */
        list: ( algo: string ) : string[] => callMethod( 'listMappings', algo )

    }

}

export { PhoneticRegistry };