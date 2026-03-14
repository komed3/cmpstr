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
 * @module Utils
 * @name Normalizer
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { NormalizeFlags, NormalizerFn } from './Types';

import { ErrorUtil } from './Errors';
import { HashTable } from './HashTable';


/**
 * The Normalizer class providing methods to normalize strings based on various flags.
 */
export class Normalizer {

    /**
     * A map that holds normalization functions based on the flags.
     * This allows for reusing normalization logic without recomputing it.
     */
    private static pipeline = new Map< string, NormalizerFn > ();

    /**
     * A cache to store normalized strings based on the flags and input.
     * This helps avoid recomputing normalization for the same input and flags.
     */
    private static cache = new HashTable< NormalizeFlags, string > ();

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
        return Array.from( new Set ( flags ) ).sort().join( '' ) as NormalizeFlags;
    }

    /**
     * Returns a normalization function based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {NormalizerFn} - A function that normalizes a string based on the provided flags
     * @throws {CmpStrInternalError} - Throws an error if the pipeline creation fails
     */
    private static getPipeline ( flags: NormalizeFlags ) : NormalizerFn {
        return ErrorUtil.wrap< NormalizerFn >( () => {
            // Return the cached pipeline if it exists
            const cached = Normalizer.pipeline.get( flags );
            if ( cached ) return cached;

            // Build the normalization pipeline based on the flags
            const { REGEX } = Normalizer;
            const steps: NormalizerFn[] = [];

            for ( let i = 0; i < flags.length; i++ ) {
                switch ( flags[ i ] ) {
                    case 'd': steps.push( s => s.normalize( 'NFD' ) ); break;
                    case 'i': steps.push( s => s.toLowerCase() ); break;
                    case 'k': steps.push( s => s.replace( REGEX.nonLetters, '' ) ); break;
                    case 'n': steps.push( s => s.replace( REGEX.nonNumbers, '' ) ); break;
                    case 'r': steps.push( s => s.replace( REGEX.doubleChars, '$1' ) ); break;
                    case 's': steps.push( s => s.replace( REGEX.specialChars, '' ) ); break;
                    case 't': steps.push( s => s.trim() ); break;
                    case 'u': steps.push( s => s.normalize( 'NFC' ) ); break;
                    case 'w': steps.push( s => s.replace( REGEX.whitespace, ' ' ) ); break;
                    case 'x': steps.push( s => s.normalize( 'NFKC' ) ); break;
                }
            }

            // Create a normalization function that applies all the steps in sequence
            const fn: NormalizerFn = ( input: string ) => {
                let v = input;
                for ( let i = 0; i < steps.length; i++ ) v = steps[ i ]( v );

                return v;
            };

            // Cache and return the normalization function for the given flags
            Normalizer.pipeline.set( flags, fn );
            return fn;
        }, `Failed to create normalization pipeline for flags: ${flags}`, { flags } );
    }

    /**
     * Normalizes the input string or array of strings based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {string | string[]} input - The string or array of strings to normalize
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @param {NormalizeFlags} [normalizedFlags] - Optional pre-canonicalized flags to avoid redundant canonicalization
     * @returns {string | string[]} - The normalized string(s)
     * @throws {CmpStrInternalError} - Throws an error if the normalization process fails
     */
    static normalize (
        input: string | string[], flags: NormalizeFlags,
        normalizedFlags?: NormalizeFlags
    ) : string | string[] {
        return ErrorUtil.wrap< string | string[] >( () => {
            if ( ! flags || typeof flags !== 'string' || ! input ) return input;

            // Canonicalize the flags to ensure consistent ordering
            flags = normalizedFlags ?? this.canonicalFlags( flags );
            const pipeline = Normalizer.getPipeline( flags );

            // Function to normalize a single string using the pipeline and cache
            const normalizeOne = ( s: string ) : string => {
                // Generate a cache key based on the flags and input
                const key: string | false = Normalizer.cache.key( flags, [ s ] );

                // If the key exists in the cache, return the cached result
                if ( key && Normalizer.cache.has( key ) ) return Normalizer.cache.get( key )!;

                // Normalize the input using the pipeline for the given flags
                const res = pipeline( s );

                // If a key was generated, store the result in the cache
                if ( key ) Normalizer.cache.set( key, res );

                return res;
            };

            // If input is an array, normalize each string in the array
            return Array.isArray( input ) ? input.map( normalizeOne ) : normalizeOne( input );
        }, `Failed to normalize input with flags: ${flags}`, { input, flags } );
    }

    /**
     * Asynchronously normalizes the input string or array of strings based on the
     * provided flags. This method is useful for handling large inputs or when
     * normalization needs to be done in a non-blocking way.
     * 
     * @param {string | string[]} input - The string or array of strings to normalize
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps
     * @returns {Promise< string | string[] >} - A promise that resolves to the normalized string(s)
     * @throws {CmpStrInternalError} - Throws an error if the normalization process fails
     */
    static async normalizeAsync ( input: string | string[], flags: NormalizeFlags ) : Promise< string | string[] > {
        return await ErrorUtil.wrapAsync< string | string[] >( async () => {
            if ( ! flags || typeof flags !== 'string' || ! input ) return input;

            return await ( Array.isArray( input )
                // If input is an array, normalize each string in the array asynchronously
                ? Promise.all( input.map( s => Normalizer.normalize( s, flags ) ) as string[] )
                // If input is a single string, normalize it asynchronously
                : Promise.resolve( Normalizer.normalize( input, flags ) ) );
        }, `Failed to asynchronously normalize input with flags: ${flags}`, { input, flags } );
    }

    /**
     * Clears the normalization pipeline and cache.
     * This is useful for resetting the state of the Normalizer.
     */
    static clear () : void {
        Normalizer.pipeline.clear();
        Normalizer.cache.clear();
    }

}
