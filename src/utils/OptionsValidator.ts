/**
 * CmpStr Options Validator
 * src/utils/OptionsValidator.ts
 * 
 * This module provides a lightweight, high-performance validator for user supplied
 * CmpStr options. It only performs a small number of checks and delegates to the
 * existing registries for metric and phonetic validation.
 * 
 * The goal is to fail fast on obvious invalid input while avoiding any heavy
 * computation or allocations that could cause "overheat".
 * 
 * @module Utils
 * @name OptionsValidator
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { CmpStrOptions, CmpStrProcessors } from './Types';

import { CmpStrValidationError } from './Errors';
import { MetricRegistry } from '../metric';
import { PhoneticRegistry } from '../phonetic';


/**
 * Utility for validating CmpStr options.
 * 
 * The validator is designed to be lightweight and safe to call frequently.
 */
export class OptionsValidator {

    // Allowed normalization flags
    private static readonly ALLOWED_FLAGS = new Set( [ 'd', 'u', 'x', 'w', 't', 'r', 's', 'k', 'n', 'i' ] );

    // Allowed output modes
    private static readonly ALLOWED_OUTPUT = new Set( [ 'orig', 'prep' ] );

    /**
     * Validate the provided CmpStr options object.
     * 
     * This method performs a series of checks on the options object, including:
     * - Checking that boolean options are actually booleans
     * - Validating normalization flags
     * - Validating output mode
     * - Validating that the specified metric exists in the MetricRegistry
     * - Validating that any specified phonetic algorithm exists in the PhoneticRegistry
     * 
     * If any validation fails, a CmpStrValidationError is thrown with details about the failure.
     * 
     * @param {CmpStrOptions} [opt] - The options object to validate
     * @throws {CmpStrValidationError} If any validation check fails
     */
    public static validateOptions ( opt?: CmpStrOptions ) : void {
        if ( ! opt ) return;

        if ( 'raw' in opt ) this.validateBoolean( opt.raw, 'raw' );
        if ( 'removeZero' in opt ) this.validateBoolean( opt.removeZero, 'removeZero' );
        if ( 'safeEmpty' in opt ) this.validateBoolean( opt.safeEmpty, 'safeEmpty' );
        if ( 'flags' in opt ) this.validateFlags( opt.flags );
        if ( 'metric' in opt ) this.validateMetric( opt.metric );
        if ( 'output' in opt ) this.validateOutput( opt.output );
        if ( 'processors' in opt ) this.validateProcessors( opt.processors );
    }

    /**
     * Validate boolean-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} If the value is not a boolean
     */
    public static validateBoolean ( value: unknown, name: string ) : void {
        if ( value === undefined ) return;
        if ( typeof value !== 'boolean' ) throw new CmpStrValidationError (
            `Invalid option <${name}>: expected boolean`, { name, value }
        );
    }

    /**
     * Validate normalization flags.
     * 
     * @param {unknown} flags - The flags to validate
     * @throws {CmpStrValidationError} If the flags are not a string or contain invalid characters
     */
    public static validateFlags ( flags: unknown ) : void {
        if ( flags === undefined ) return;
        if ( typeof flags !== 'string' ) throw new CmpStrValidationError (
            `Invalid option <flags>: expected string`, { flags }
        );

        if ( flags.length === 0 ) return;
        for ( let i = 0, len = flags.length; i < len; i += 1 ) {
            if ( ! OptionsValidator.ALLOWED_FLAGS.has( flags[ i ] ) ) {
                throw new CmpStrValidationError (
                    `Invalid normalization flag <${ flags[ i ] }> in <flags>`,
                    { flags, invalid: flags[ i ] }
                );
            }
        }
    }

    /**
     * Validate CmpStr output mode.
     * 
     * @param {unknown} output - The output mode to validate
     * @throws {CmpStrValidationError} If the output mode is not a string or not allowed
     */
    public static validateOutput ( output: unknown ) : void {
        if ( output === undefined ) return;
        if ( typeof output !== 'string' || ! OptionsValidator.ALLOWED_OUTPUT.has( output ) ) {
            throw new CmpStrValidationError (
                `Invalid option <output>: expected ${ Array.from( OptionsValidator.ALLOWED_OUTPUT ).join( ' | ' ) }`,
                { output }
            );
        }
    }

    /**
     * Validate metric against the MetricRegistry.
     * 
     * Checks that the metric is a non-empty string and exists in the registry.
     * This allows for validating both built-in and dynamically registered metrics.
     * 
     * @param {unknown} metric - The metric name to validate
     * @throws {CmpStrValidationError} If the metric is not a string or not registered
     */
    public static validateMetric ( metric: unknown ) : void {
        if ( metric === undefined ) return;
        if ( typeof metric !== 'string' || metric.length === 0 ) throw new CmpStrValidationError (
            `Invalid option <metric>: expected non-empty string`, { metric }
        );

        if ( ! MetricRegistry.has( metric ) ) throw new CmpStrValidationError (
            `Metric <${metric}> is not registered`,
            { metric, available: MetricRegistry.list() }
        );
    }

    /**
     * Validate phonetic processor options.
     * 
     * Checks that the phonetic algorithm is specified correctly and exists in the registry.
     * This allows for validating both built-in and dynamically registered phonetic algorithms.
     * 
     * @param {unknown} processors - The processors options to validate
     * @throws {CmpStrValidationError} If the processors option is invalid or references an unknown phonetic algorithm
     */
    public static validateProcessors ( processors: unknown ) : void {
        if ( processors === undefined ) return;
        if ( typeof processors !== 'object' || processors === null ) throw new CmpStrValidationError (
            `Invalid option <processors>: expected object`, { processors }
        );

        if ( ( processors as CmpStrProcessors ).phonetic ) {
            const { algo } = ( processors as CmpStrProcessors ).phonetic!;

            if ( typeof algo !== 'string' || algo.length === 0 ) throw new CmpStrValidationError (
                `Invalid option <processors.phonetic.algo>: expected non-empty string`,
                { processors }
            );

            if ( ! PhoneticRegistry.has( algo ) ) throw new CmpStrValidationError (
                `Phonetic algorithm <${algo}> is not registered`,
                { algo, available: PhoneticRegistry.list() }
            );
        }
    }

}
