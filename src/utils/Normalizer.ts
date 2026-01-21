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

import type { NormalizeFlags, NormalizerFn } from './Types';

import { HashTable } from './HashTable';

/**
 * The Normalizer class providing methods to normalize strings based on various flags.
 */
export class Normalizer {

    /**
     * A map that holds normalization functions based on the flags.
     * This allows for reusing normalization logic without recomputing it.
     */
    private static pipeline: Map< string, NormalizerFn > = new Map ();

    /**
     * A cache to store normalized strings based on the flags and input.
     * This helps avoid recomputing normalization for the same input and flags.
     */
    private static cache: HashTable< NormalizeFlags, string > = new HashTable ();

    /** Regular expressions used in normalization steps */
    private static readonly REGEX = {
        whitespace: /\s+/g,
        doubleChars: /(.)\1+/g,
        specialChars: /[^\p{L}\p{N}\s]/gu,
        nonLetters: /[^\p{L}]/gu,
        nonNumbers: /\p{N}/gu
    };

    /**
     * Returns a canonical version of the flags by removing duplicates and sorting them.
     * 
     * @param {NormalizeFlags} flags - The normalization flags
     * @returns {NormalizeFlags} - The canonicalized flags
     */
    private static canonicalFlags ( flags: NormalizeFlags ) : NormalizeFlags {
        return Array.from( new Set( flags ) ).sort().join( '' ) as NormalizeFlags;
    }

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
        const { REGEX } = Normalizer;
        const steps: Array< [ string, NormalizerFn ] > = [
            [ 'd', s => s.normalize( 'NFD' ) ],
            [ 'i', s => s.toLowerCase() ],
            [ 'k', s => s.replace( REGEX.nonLetters, '' ) ],
            [ 'n', s => s.replace( REGEX.nonNumbers, '' ) ],
            [ 'r', s => s.replace( REGEX.doubleChars, '$1' ) ],
            [ 's', s => s.replace( REGEX.specialChars, '' ) ],
            [ 't', s => s.trim() ],
            [ 'u', s => s.normalize( 'NFC' ) ],
            [ 'w', s => s.replace( REGEX.whitespace, ' ' ) ],
            [ 'x', s => s.normalize( 'NFKC' ) ]
        ];

        // Compile the normalization function based on the provided flags
        const pipeline = steps.filter( ( [ f ] ) => flags.includes( f ) ).map( ( [ , fn ] ) => fn );
        const fn: NormalizerFn = s => pipeline.reduce( ( v, f ) => f( v ), s );

        // Cache the compiled function for the given flags
        Normalizer.pipeline.set( flags, fn );
        return fn;
    }

    /**
     * Normalizes the input string or array of strings based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {string | string[]} input - The string or array of strings to normalize
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {string | string[]} - The normalized string(s)
     */
    static normalize ( input: string | string[], flags: NormalizeFlags ) : string | string[] {
        if ( ! flags || typeof flags !== 'string' || ! input ) return input;

        // Canonicalize the flags to ensure consistent ordering
        flags = this.canonicalFlags( flags );

        // If input is an array, normalize each string in the array
        if ( Array.isArray( input ) ) return input.map( s => Normalizer.normalize( s, flags ) ) as string[];

        // Generate a cache key based on the flags and input
        const key: string | false = Normalizer.cache.key( flags, [ input ] );

        // If the key exists in the cache, return the cached result
        if ( key && Normalizer.cache.has( key ) ) return Normalizer.cache.get( key )!;

        // Normalize the input using the pipeline for the given flags
        const res: string = Normalizer.getPipeline( flags )( input );

        // If a key was generated, store the result in the cache
        if ( key ) Normalizer.cache.set( key, res );

        return res;
    }

    /**
     * Asynchronously normalizes the input string or array of strings based on the
     * provided flags. This method is useful for handling large inputs or when
     * normalization needs to be done in a non-blocking way.
     * 
     * @param {string | string[]} input - The string or array of strings to normalize
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {Promise< string | string[] >} - A promise that resolves to the normalized string(s)
     */
    static async normalizeAsync ( input: string | string[], flags: NormalizeFlags ) : Promise< string | string[] > {
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
