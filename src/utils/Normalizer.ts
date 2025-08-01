/**
 * Normalizer Utility
 * src/utils/Normalizer.ts
 * 
 * @see https://en.wikipedia.org/wiki/Text_normalization
 * @see https://en.wikipedia.org/wiki/Unicode_equivalence
 * 
 * This module provides a Normalizer class that allows for string normalization based
 * on various flags. It uses a pipeline of normalization functions that can be reused
 * and cached for efficiency. The Normalizer can handle both single strings and arrays
 * of strings, and supports synchronous and asynchronous normalization.
 * 
 * Supported flags:
 *  'd' :: Normalize to NFD (Normalization Form Decomposed)
 *  'u' :: Normalize to NFC (Normalization Form Composed)
 *  'x' :: Normalize to NFKC (Normalization Form Compatibility Composed)
 *  'w' :: Collapse whitespace
 *  't' :: Remove leading and trailing whitespace
 *  'r' :: Remove double characters
 *  's' :: Remove punctuation / special characters
 *  'k' :: Remove non-letter characters
 *  'n' :: Remove non-number characters
 *  'i' :: Case insensitive (convert to lowercase)
 * 
 * @module Utils/Normalizer
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { NormalizerFn, NormalizeFlags } from './Types';
import { HashTable } from './HashTable';

/**
 * The Normalizer class providing methods to normalize strings based on various flags.
 */
export class Normalizer {

    /**
     * A map that holds normalization functions based on the flags.
     * This allows for reusing normalization logic without recomputing it.
     */
    private static pipeline: Map<string, NormalizerFn> = new Map ();

    /**
     * A cache to store normalized strings based on the flags and input.
     * This helps avoid recomputing normalization for the same input and flags.
     */
    private static cache: HashTable<NormalizeFlags, string> = new HashTable ();

    /**
     * Returns a normalization function based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {NormalizerFn} - A function that normalizes a string based on the provided flags
     */
    private static getPipeline ( flags: NormalizeFlags ) : NormalizerFn {

        // Return the cached pipeline if it exists
        if ( Normalizer.pipeline.has( flags ) ) return Normalizer.pipeline.get( flags )!;

        // Define the normalization steps based on the flags
        const steps: NormalizerFn[] = [];

        // Normalize to NFD (Normalization Form Decomposed)
        if ( flags.includes( 'd' ) ) steps.push( str => str.normalize( 'NFD' ) );
        // Normalize to NFC (Normalization Form Composed)
        if ( flags.includes( 'u' ) ) steps.push( str => str.normalize( 'NFC' ) );
        // Normalize to NFKC (Normalization Form Compatibility Composed)
        if ( flags.includes( 'x' ) ) steps.push( str => str.normalize( 'NFKC' ) );
        // Collapse whitespace
        if ( flags.includes( 'w' ) ) steps.push( str => str.replace( /\s+/g, ' ' ) );
        // Remove leading and trailing whitespace
        if ( flags.includes( 't' ) ) steps.push( str => str.trim() );
        // Remove double characters
        if ( flags.includes( 'r' ) ) steps.push( str => str.replace( /(.)\1+/g, '$1' ) );
        // Remove punctuation / special characters
        if ( flags.includes( 's' ) ) steps.push( str => str.replace( /[^\p{L}\p{N}\s]/gu, '' ) );
        // Remove non-letter characters
        if ( flags.includes( 'k' ) ) steps.push( str => str.replace( /[^\p{L}]/gu, '' ) );
        // Remove non-number characters
        if ( flags.includes( 'n' ) ) steps.push( str => str.replace( /\p{N}/gu, '' ) );
        // Case insensitive
        if ( flags.includes( 'i' ) ) steps.push( str => str.toLowerCase() );

        // Build the normalization function from the steps
        const compiled: NormalizerFn = ( input: string ) => {

            let res: string = input;

            for ( const step of steps ) res = step( res );

            return res;

        };

        // Cache the compiled function for the given flags
        Normalizer.pipeline.set( flags, compiled );

        // Return the compiled normalization function
        return compiled;

    }

    /**
     * Normalizes the input string or array of strings based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {string|string[]} input - The string or array of strings to normalize
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {string|string[]} - The normalized string(s)
     */
    static normalize ( input: string | string[], flags: NormalizeFlags ) : string | string[] {

        // If input is an array, normalize each string in the array
        if ( Array.isArray( input ) ) return input.map( s => Normalizer.normalize( s, flags ) ) as string[];

        // If input or flags are not provided, return the input as is
        if ( ! flags || typeof flags !== 'string' || ! input ) return input;

        // Generate a cache key based on the flags and input
        const key: string | false = Normalizer.cache.key( flags, [ input ] );

        // If the key exists in the cache, return the cached result
        if ( key && Normalizer.cache.has( key ) ) return Normalizer.cache.get( key )!;

        // Normalize the input using the pipeline for the given flags
        const res: string = Normalizer.getPipeline( flags )( input );

        // If a key was generated, store the result in the cache
        if ( key ) Normalizer.cache.set( key, res );

        // Return the normalized result
        return res;

    }

    /**
     * Asynchronously normalizes the input string or array of strings based on the
     * provided flags. This method is useful for handling large inputs or when
     * normalization needs to be done in a non-blocking way.
     * 
     * @param {string|string[]} input - The string or array of strings to normalize
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {Promise<string|string[]>} - A promise that resolves to the normalized string(s)
     */
    static async normalizeAsync ( input: string | string[], flags: NormalizeFlags ) : Promise<string | string[]> {

        return await ( Array.isArray( input )
            // If input is an array, normalize each string in the array asynchronously
            ? Promise.all( input.map( s => Normalizer.normalize( s, flags ) ) as string[] )
            // If input is a single string, normalize it asynchronously
            : Promise.resolve( Normalizer.normalize( input, flags ) ) );

    }

    /**
     * Clears the normalization pipeline and cache.
     * This is useful for resetting the state of the Normalizer.
     */
    static clear () : void {

        Normalizer.pipeline.clear();
        Normalizer.cache.clear();

    }

};
