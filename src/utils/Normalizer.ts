/**
 * Normalizer Utility
 * src/utils/Normalizer.ts
 * 
 * @see https://en.wikipedia.org/wiki/Text_normalization
 * @see https://en.wikipedia.org/wiki/Unicode_equivalence
 * 
 * This module provides a Normalizer class that allows for string normalization based on
 * various flags. It uses a pipeline of normalization functions that can be reused and
 * cached for efficiency.
 * 
 * Supported flags:
 * 'w': Collapse whitespace
 * 't': Remove leading and trailing whitespace
 * 's': Remove punctuation / special characters
 * 'r': Remove diacritics
 * 'k': Remove non-letter characters
 * 'n': Remove non-number characters
 * 'i': Case insensitive (convert to lowercase)
 * 'd': Normalize to NFD (Normalization Form Decomposed)
 * 'u': Normalize to NFC (Normalization Form Composed)
 * 
 * @module Normalizer
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
    private static cache: HashTable<string> = new HashTable ();

    /**
     * Returns a normalization function based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps.
     * @returns {NormalizerFn} A function that normalizes a string based on the provided flags.
     */
    private static getPipeline ( flags: NormalizeFlags ) : NormalizerFn {

        // Return the cached pipeline if it exists
        if ( this.pipeline.has( flags ) ) return this.pipeline.get( flags )!;

        // Define the normalization steps based on the flags
        const steps: NormalizerFn[] = [];

        // Collapse whitespace
        if ( flags.includes( 'w' ) ) steps.push( str => str.replace( /\s+/g, ' ' ) );
        // Remove leading and trailing whitespace
        if ( flags.includes( 't' ) ) steps.push( str => str.trim() );
        // Remove punctuation / special characters
        if ( flags.includes( 's' ) ) steps.push( str => str.replace( /[^\p{L}\p{N}\s]/gu, '' ) );
        // Remove diacritics
        if ( flags.includes( 'r' ) ) steps.push( str => str.replace( /(.)\1+/g, '$1' ) );
        // Remove non-letter characters
        if ( flags.includes( 'k' ) ) steps.push( str => str.replace( /[^\p{L}]/gu, '' ) );
        // Remove non-number characters
        if ( flags.includes( 'n' ) ) steps.push( str => str.replace( /\p{N}/gu, '' ) );
        // Case insensitive
        if ( flags.includes( 'i' ) ) steps.push( str => str.toLowerCase() );
        // Normalize to NFD (Normalization Form Decomposed)
        if ( flags.includes( 'd' ) ) steps.push( str => str.normalize( 'NFD' ) );
        // Normalize to NFC (Normalization Form Composed)
        if ( flags.includes( 'u' ) ) steps.push( str => str.normalize( 'NFC' ) );

        // Build the normalization function from the steps
        const compiled: NormalizerFn = input => {

            let res: string = input;

            for ( const step of steps ) res = step( res );

            return res;

        };

        // Cache the compiled function for the given flags
        this.pipeline.set( flags, compiled );

        // Return the compiled normalization function
        return compiled;

    }

    /**
     * Normalizes the input string based on the provided flags.
     * The flags are a string of characters that define the normalization steps.
     * 
     * @param {string} input - The string to normalize.
     * @param {NormalizeFlags} flags - A string of characters representing the normalization steps.
     * @returns {string} - The normalized string.
     */
    static normalize ( input: string, flags: NormalizeFlags ) : string {

        // If input or flags are not provided, return the input as is
        if ( ! input || ! flags ) return input;

        // Generate a cache key based on the flags and input
        const key: string | false = this.cache.key( flags, input );

        // If the key exists in the cache, return the cached result
        if ( key && this.cache.has( key ) ) return this.cache.get( key )!;

        // Normalize the input using the pipeline for the given flags
        const res: string = this.getPipeline( flags )( input );

        // If a key was generated, store the result in the cache
        if ( key ) this.cache.set( key, res );

        // Return the normalized result
        return res;

    }

    /**
     * Clears the normalization pipeline and cache.
     * This is useful for resetting the state of the Normalizer.
     */
    static clear () : void {

        this.pipeline.clear();
        this.cache.clear();

    }

};