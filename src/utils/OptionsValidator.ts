/**
 * CmpStr Options Validator
 * src/utils/OptionsValidator.ts
 * 
 * This module provides the OptionsValidator class, which contains static methods for validating
 * the options passed to the CmpStr function. It checks for correct types, allowed values, and
 * the existence of specified metrics and phonetic algorithms in their respective registries.
 * 
 * If any validation fails, a CmpStrValidationError is thrown with a descriptive message and
 * relevant details about the invalid option.
 * 
 * @module Utils
 * @name OptionsValidator
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { CmpStrOptions, CmpStrProcessors, MetricOptions, PhoneticOptions } from './Types';

import { CmpStrValidationError } from './Errors';
import { MetricRegistry } from '../metric';
import { PhoneticRegistry } from '../phonetic';


/**
 * Utility for validating CmpStr options.
 * 
 * This class provides static methods to validate various aspects of the
 * options object passed to CmpStr.
 */
export class OptionsValidator {

    /** Allowed normalization flags */
    private static readonly ALLOWED_FLAGS = new Set ( [ 'd', 'u', 'x', 'w', 't', 'r', 's', 'k', 'n', 'i' ] );
    /** Allowed output modes */
    private static readonly ALLOWED_OUTPUT = new Set ( [ 'orig', 'prep' ] );
    /** Allowed comparison modes */
    private static readonly ALLOWED_MODES = new Set ( [ 'default', 'batch', 'single', 'pairwise' ] );

    /** Processor dispatch table */
    private static readonly PROCESSORS = {
        phonetic: ( opt: CmpStrProcessors[ 'phonetic' ] ) => OptionsValidator.validatePhonetic( opt )
    } as const;

    /** Metric options validation dispatch table */
    private static readonly METRIC_OPT_MAP = {
        mode:      ( v: unknown ) => OptionsValidator.validateMode( v ),
        delimiter: ( v: unknown ) => OptionsValidator.validateString( v, 'opt.delimiter' ),
        pad:       ( v: unknown ) => OptionsValidator.validateString( v, 'opt.pad' ),
        q:         ( v: unknown ) => OptionsValidator.validateNumber( v, 'opt.q' ),
        match:     ( v: unknown ) => OptionsValidator.validateNumber( v, 'opt.match' ),
        mismatch:  ( v: unknown ) => OptionsValidator.validateNumber( v, 'opt.mismatch' ),
        gap:       ( v: unknown ) => OptionsValidator.validateNumber( v, 'opt.gap' )
    } as const;

    /** Phonetic algorithm options validation dispatch table */
    private static readonly PHONETIC_OPT_MAP = {
        map:       ( v: unknown ) => OptionsValidator.validateString( v, 'opt.map' ),
        delimiter: ( v: unknown ) => OptionsValidator.validateString( v, 'opt.delimiter' ),
        length:    ( v: unknown ) => OptionsValidator.validateNumber( v, 'opt.length' ),
        pad:       ( v: unknown ) => OptionsValidator.validateString( v, 'opt.pad' ),
        dedupe:    ( v: unknown ) => OptionsValidator.validateBoolean( v, 'opt.dedupe' ),
        fallback:  ( v: unknown ) => OptionsValidator.validateString( v, 'opt.fallback' )
    } as const;

    /**
     * Internal helper to convert a Set to a string for error messages.
     * 
     * @param {Set< string >} set - The set to convert
     * @returns {string} - A string representation of the set
     */
    private static set2string ( set: Set< string > ) : string {
        return Array.from( set ).join( ' | ' );
    }

    /**
     * Internal helper to validate primitive types.
     * 
     * @param {unknown} value - The value to validate.
     * @param {string} name - The name of the option (for error messages).
     * @param {'boolean' | 'number' | 'string'} type - The expected type of the value.
     * @throws {CmpStrValidationError} If the value is not of the expected type or is NaN (for numbers).
     */
    private static validateType ( value: unknown, name: string, type: 'boolean' | 'number' | 'string' ) : void {
        if ( value === undefined ) return;

        if ( typeof value !== type || ( type === 'number' && Number.isNaN( value ) ) ) {
            throw new CmpStrValidationError (
                `Invalid option <${name}>: expected ${type}`,
                { name, value }
            );
        }
    }

    /**
     * Internal helper to validate enum-like values.
     * 
     * @param {unknown} value - The value to validate.
     * @param {string} name - The name of the option (for error messages).
     * @param {Set< string >} set - The set of allowed values.
     * @throws {CmpStrValidationError} If the value is not a string or is not in the allowed set.
     */
    private static validateEnum ( value: unknown, name: string, set: Set< string > ) : void {
        if ( value === undefined ) return;

        if ( typeof value !== 'string' || ! set.has( value ) ) {
            throw new CmpStrValidationError (
                `Invalid option <${name}>: expected ${ OptionsValidator.set2string( set ) }`,
                { name, value }
            );
        }
    }

    /**
     * Internal helper to validate objects against a dispatch table of validation functions.
     * 
     * @param {unknown} opt - The object to validate.
     * @param {Object} map - A dispatch table mapping keys to validation functions.
     * @throws {CmpStrValidationError} If any property in the object fails validation.
     */
    private static validateMap ( opt: unknown, map:
        | typeof OptionsValidator.METRIC_OPT_MAP
        | typeof OptionsValidator.PHONETIC_OPT_MAP
    ) : void {
        if ( ! opt ) return;

        for ( const k in opt ) {
            const fn = map[ k as keyof typeof map ];
            if ( fn ) fn( ( opt as any )[ k ] );
        }
    }

    /**
     * Internal helper to validate registry-based options (metrics and phonetic algorithms).
     * 
     * @param {unknown} value - The value to validate.
     * @param {string} name - The name of the option (for error messages).
     * @param {( v: string ) => boolean} has - A function that checks if the registry contains a given name.
     * @param {() => string[]} list - A function that returns a list of registered names for error messages.
     * @throws {CmpStrValidationError} If the value is not a non-empty string or is not registered.
     */
    private static validateRegistryName (
        value: unknown, name: string, has: ( v: string ) => boolean, list: () => string[]
    ) : void {
        if ( value === undefined ) return;

        if ( typeof value !== 'string' || value.length === 0 ) throw new CmpStrValidationError (
            `Invalid option <${name}>: expected non-empty string`, { name, value }
        );

        if ( ! has( value ) ) throw new CmpStrValidationError (
            `${name === 'metric' ? 'Metric' : 'Phonetic algorithm'} <${value}> is not registered`,
            { name, value, available: list() }
        );
    }

    /**
     * Validate boolean-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} - If the value is not a boolean
     */
    public static validateBoolean ( value: unknown, name: string ) : void {
        OptionsValidator.validateType( value, name, 'boolean' );
    }

    /**
     * Validate number-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} - If the value is not a number or is NaN
     */
    public static validateNumber ( value: unknown, name: string ) : void {
        OptionsValidator.validateType( value, name, 'number' );
    }

    /**
     * Validate string-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} - If the value is not a string
     */
    public static validateString ( value: unknown, name: string ) : void {
        OptionsValidator.validateType( value, name, 'string' );
    }

    /**
     * Validate normalization flags.
     * 
     * @param {unknown} value - The flags to validate
     * @throws {CmpStrValidationError} - If the flags are not a string or contain invalid characters
     */
    public static validateFlags ( value: unknown ) : void {
        if ( value === undefined ) return;

        if ( typeof value !== 'string' ) throw new CmpStrValidationError (
            `Invalid option <flags>: expected string`, { flags: value }
        );

        for ( let i = 0; i < value.length; i++ ) {
            const ch = value[ i ];

            if ( ! OptionsValidator.ALLOWED_FLAGS.has( ch ) ) throw new CmpStrValidationError (
                `Invalid normalization flag <${ch}> in <flags>: expected ${
                    OptionsValidator.set2string( OptionsValidator.ALLOWED_FLAGS )
                }`, { flags: value, invalid: ch }
            );
        }
    }

    /**
     * Validate CmpStr output mode.
     * 
     * @param {unknown} value - The output mode to validate
     * @throws {CmpStrValidationError} - If the output mode is not a string or not allowed
     */
    public static validateOutput ( value: unknown ) : void {
        OptionsValidator.validateEnum( value, 'output', OptionsValidator.ALLOWED_OUTPUT );
    }

    /**
     * Validate CmpStr comparison mode.
     * 
     * @param {unknown} value - The comparison mode to validate
     * @throws {CmpStrValidationError} - If the comparison mode is not a string or not allowed
     */
    public static validateMode ( value: unknown ) : void {
        OptionsValidator.validateEnum( value, 'mode', OptionsValidator.ALLOWED_MODES );
    }

    /**
     * Validate metric name against the MetricRegistry.
     * 
     * @param {unknown} value - The metric name to validate
     * @throws {CmpStrValidationError} - If the metric is not a string or not registered
     */
    public static validateMetricName ( value: unknown ) : void {
        OptionsValidator.validateRegistryName( value, 'metric', MetricRegistry.has, MetricRegistry.list );
    }

    /**
     * Validate phonetic algorithm name against the PhoneticRegistry.
     * 
     * @param {unknown} value - The phonetic algorithm name to validate
     * @throws {CmpStrValidationError} - If the phonetic algorithm is not a string or not registered
     */
    public static validatePhoneticName ( value: unknown ) : void {
        OptionsValidator.validateRegistryName( value, 'phonetic', PhoneticRegistry.has, PhoneticRegistry.list );
    }

    /**
     * Validate metric options.
     * 
     * @param {MetricOptions} opt - The metric options to validate
     * @throws {CmpStrValidationError} - If any metric option is invalid
     */
    public static validateMetricOptions ( opt?: MetricOptions ) : void {
        OptionsValidator.validateMap( opt, OptionsValidator.METRIC_OPT_MAP );
    }

    /**
     * Validate phonetic options.
     * 
     * @param {PhoneticOptions} opt - The phonetic options to validate
     * @throws {CmpStrValidationError} - If any phonetic option is invalid
     */
    public static validatePhoneticOptions ( opt?: PhoneticOptions ) : void {
        OptionsValidator.validateMap( opt, OptionsValidator.PHONETIC_OPT_MAP );
    }

}
