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

import type { MetricInput, MetricOptions, MetricCompute, PhoneticMapping, PhoneticMap } from '../utils/Types';
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