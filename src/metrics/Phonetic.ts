/**
 * Abstract Phonetic
 * src/metrics/Phonetic.ts
 * 
 * @see https://en.wikipedia.org/wiki/Phonetic_algorithm
 * 
 * This module provides an abstract class for phonetic metrics, which can be used to
 * compare strings based on their phonetic representation. It allows for the implementation
 * of various phonetic algorithms by extending the abstract class.
 * 
 * The class includes methods for managing phonetic mappings, which are used to convert
 * words into their phonetic representation.
 * 
 * @module Phonetic
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute, PhoneticMapping, PhoneticMap, PhoneticRule } from '../utils/Types';
import { Metric } from './Metric';
import { Pool } from '../utils/Pool';

export interface PhoneticRaw {
    indexA: string[];
    indexB: string[];
};

/**
 * Abstract class representing a phonetic metric extending Metric.
 * 
 * @abstract
 */
export abstract class Phonetic extends Metric<PhoneticRaw> {

    /**
     * Phonetic mapping used for phonetic algorithms.
     * 
     * This mapping is used to convert words into their phonetic representation
     * based on the specific phonetic algorithm implemented in the subclass.
     */
    protected static mapping: PhoneticMapping;

    /**
     * Returns a list of supported phonetic mappings.
     *  
     * @returns {string[]} - An array of supported phonetic mappings
     */
    public static supportedMappings () : string[] {

        return Object.keys( this.mapping );

    }

    /**
     * Checks if a phonetic mapping exists for the given ID.
     * 
     * @param {string} id - The ID of the phonetic mapping to check
     * @returns {boolean} - True if the mapping exists, false otherwise
     */
    public static hasMapping ( id: string ) : boolean {

        return id in this.mapping;

    }

    /**
     * Adds a new phonetic mapping.
     * 
     * @param {string} id - The ID for the new phonetic mapping
     * @param {PhoneticMap} mapping - The phonetic mapping to add
     * @returns {boolean} - True if the mapping was added successfully, false if it already exists
     */
    public static addMapping ( id: string, mapping: PhoneticMap ) : boolean {

        if ( this.hasMapping( id ) ) return false;

        this.mapping[ id ] = mapping;

        return true;

    }

    /**
     * Deletes a phonetic mapping by its ID.
     * 
     * @param {string} id - The ID of the phonetic mapping to delete
     * @returns {boolean} - True if the mapping was deleted successfully, false if it does not exist
     */
    public static deleteMapping ( id: string ) : boolean {

        if ( ! this.hasMapping( id ) ) return false;

        delete this.mapping[ id ];

        return true;

    }

    constructor (
        metric: string,
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        super ( metric, a, b, options, true );

    }

    /**
     * Applies phonetic rules to a character in a word context.
     * 
     * This method is designed to be generic and efficient for all phonetic algorithms.
     * It checks all rule types (prev, next, prevNot, nextNot, position, etc.) and
     * returns either the appropriate code (string) or undefined.
     * 
     * @param {string} char - The current character
     * @param {number} i - The current position within the word
     * @param {string[]} chars - The word as an array of characters
     * @param {PhoneticRule[]} rules - The ruleset from the mapping
     * @returns {string|undefined} - The rule code or undefined if no rule applies
     */
    protected phoneticRules (
        char: string, i: number, chars: string[],
        rules: PhoneticRule[]
    ) : string | undefined {

        // If no rules are provided, return undefined
        if ( ! rules || ! rules.length ) return undefined;

        // Get the previous, next, and surrounding characters
        const prev: string = chars[ i - 1 ] || '', prev2: string = chars[ i - 2 ] || '';
        const next: string = chars[ i + 1 ] || '', next2: string = chars[ i + 2 ] || '';

        // Iterate over the rules to find a matching rule for the current character
        for ( const rule of rules ) {

            // Skip if the rule does not match the current character
            if ( rule.char && rule.char !== char ) continue;

            // Position in the word (start, end, middle)
            if ( rule.position === 'start' && i !== 0 ) continue;
            if ( rule.position === 'end' && i !== chars.length - 1 ) continue;
            if ( rule.position === 'middle' && 0 < i && i > chars.length - 1 ) continue;

            // Previous character (i-1)
            if ( rule.prev && ! rule.prev.includes( prev ) ) continue;
            if ( rule.prevNot && rule.prevNot.includes( prev ) ) continue;

            // Preceding character (i-2)
            if ( rule.prev2 && ! rule.prev2.includes( prev2 ) ) continue;
            if ( rule.prev2Not && rule.prev2Not.includes( prev2 ) ) continue;

            // Next character (i+1)
            if ( rule.next && ! rule.next.includes( next ) ) continue;
            if ( rule.nextNot && rule.nextNot.includes( next ) ) continue;

            // Upcoming character (i+2)
            if ( rule.next2 && ! rule.next2.includes( next2 ) ) continue;
            if ( rule.next2Not && rule.next2Not.includes( next2 ) ) continue;

            // Special case: Beginning of a word (e.g. chars.slice(0, n))
            if ( rule.leading && ! rule.leading.includes(
                chars.slice( 0, rule.leading.length ).join( '' )
            ) ) continue;

            // Special case: end of word (e.g. chars.slice(-n))
            if ( rule.trailing && ! rule.trailing.includes(
                chars.slice( -rule.trailing.length ).join( '' )
            ) ) continue;

            // Check multiple characters (e.g. bigram/trigram)
            if ( rule.match && ! rule.match.every(
                ( c: string, j: number ) => chars[ i + j ] === c
            ) ) continue;

            // If all conditions met, return the rule code
            return rule.code;

        }

        // If no rule matched, return undefined
        return undefined;

    }

    /**
     * Abstract method to be implemented by subclasses for computing the phonetic index
     * for the given input string. It applies the phonetic mapping and returns an array
     * of phonetic codes for each word in the input.
     * 
     * @param {string} input - The input string to process
     * @returns {string[]} - An array of phonetic codes for each word in the input
     * @throws {Error} - Throws an error if the method is not overridden in a subclass
     */
    protected phoneticIndex ( input: string ) : string[] {

        throw new Error ( `method phoneticIndex() must be overridden in a subclass` );

    }

    /**
     * Computes the phonetic based similatity for the two input strings.
     * 
     * This method processes both inputs, applies the phonetic mapping, and calculates
     * the similarity based on phonetic indices and the Jaccard index.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {MetricCompute<PhoneticRaw>} - Object containing the similarity result and phonetic indices
     */
    protected override compute ( a: string, b: string ) : MetricCompute<PhoneticRaw> {

        // Computes phonetic index for `a` and `b`
        const indexA: string[] = this.phoneticIndex( a );
        const indexB: string[] = this.phoneticIndex( b );

        const sizeA: number = indexA.length, sizeB: number = indexB.length;

        // Acquire two sets from the Pool
        const [ setA, setB ] = Pool.acquireMany( 'set', [ sizeA, sizeB ] );

        // Fill setA and setB from the computed phonetic indices
        for ( const A of this.phoneticIndex( a ) ) setA.add( A );
        for ( const B of this.phoneticIndex( b ) ) setB.add( B );

        // Calculate intersection size
        let intersection: number = 0;

        for ( const c of setA ) if ( setB.has( c ) ) intersection++;

        // Calculate union size (setA + elements in setB not in setA)
        const union: number = setA.size + setB.size - intersection;

        // Release sets back to the pool
        Pool.release( 'set', setA, sizeA );
        Pool.release( 'set', setB, sizeB );

        // Return the result as a MetricCompute object
        return {
            res: union === 0 ? 1 : Metric.clamp( intersection / union ),
            raw: { indexA, indexB }
        };

    }

}