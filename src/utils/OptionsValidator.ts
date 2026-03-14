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
    /** Allowed processor types */
    private static readonly ALLOWED_PROCESSORS = new Map ( [ [ 'phonetic', 'validatePhonetic' ] ] );

    /**
     * Helper method to convert a Set to a string for error messages.
     * 
     * @param {Set< string >} set - The set to convert
     * @returns {string} - A string representation of the set
     */
    private static set2string ( set: Set< string > ) : string {
        return Array.from( set ).join( ' | ' );
    }

    /**
     * Validate boolean-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} - If the value is not a boolean
     */
    public static validateBoolean ( value: unknown, name: string ) : void {
        if ( value === undefined ) return;
        if ( typeof value !== 'boolean' ) throw new CmpStrValidationError (
            `Invalid option <${name}>: expected boolean`, { name, value }
        );
    }

    /**
     * Validate number-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} - If the value is not a number or is NaN
     */
    public static validateNumber ( value: unknown, name: string ) : void {
        if ( value === undefined ) return;
        if ( typeof value !== 'number' || isNaN( value ) ) throw new CmpStrValidationError (
            `Invalid option <${name}>: expected number`, { name, value }
        );
    }

    /**
     * Validate string-like values.
     * 
     * @param {unknown} value - The value to validate
     * @param {string} name - The name of the option (for error messages)
     * @throws {CmpStrValidationError} - If the value is not a string
     */
    public static validateString ( value: unknown, name: string ) : void {
        if ( value === undefined ) return;
        if ( typeof value !== 'string' ) throw new CmpStrValidationError (
            `Invalid option <${name}>: expected string`, { name, value }
        );
    }

    /**
     * Validate normalization flags.
     * 
     * @param {unknown} flags - The flags to validate
     * @throws {CmpStrValidationError} - If the flags are not a string or contain invalid characters
     */
    public static validateFlags ( flags: unknown ) : void {
        if ( flags === undefined ) return;
        if ( typeof flags !== 'string' ) throw new CmpStrValidationError (
            `Invalid option <flags>: expected string`, { flags }
        );

        if ( flags.length === 0 ) return;
        for ( const ch of flags ) {
            if ( ! OptionsValidator.ALLOWED_FLAGS.has( ch ) ) throw new CmpStrValidationError (
                `Invalid normalization flag <${ ch }> in <flags>: expected ${
                    OptionsValidator.set2string( OptionsValidator.ALLOWED_FLAGS )
                }`, { flags, invalid: ch }
            );
        }
    }

    /**
     * Validate CmpStr output mode.
     * 
     * @param {unknown} output - The output mode to validate
     * @throws {CmpStrValidationError} - If the output mode is not a string or not allowed
     */
    public static validateOutput ( output: unknown ) : void {
        if ( output === undefined ) return;
        if ( typeof output !== 'string' || ! OptionsValidator.ALLOWED_OUTPUT.has( output ) ) {
            throw new CmpStrValidationError ( `Invalid option <output>: expected ${
                OptionsValidator.set2string( OptionsValidator.ALLOWED_OUTPUT )
            }`, { output } );
        }
    }

    /**
     * Validate CmpStr comparison mode.
     * 
     * @param {unknown} mode - The comparison mode to validate
     * @throws {CmpStrValidationError} - If the comparison mode is not a string or not allowed
     */
    public static validateMode ( mode: unknown ) : void {
        if ( mode === undefined ) return;
        if ( typeof mode !== 'string' || ! OptionsValidator.ALLOWED_MODES.has( mode ) ) {
            throw new CmpStrValidationError ( `Invalid option <mode>: expected ${
                OptionsValidator.set2string( OptionsValidator.ALLOWED_MODES )
            }`, { mode } );
        }
    }

    /**
     * Validate metric against the MetricRegistry.
     * 
     * @param {unknown} metric - The metric name to validate
     * @throws {CmpStrValidationError} - If the metric is not a string or not registered
     */
    public static validateMetricName ( metric: unknown ) : void {
        if ( metric === undefined ) return;
        if ( typeof metric !== 'string' || metric.length === 0 ) throw new CmpStrValidationError (
            `Invalid option <metric>: expected non-empty string`, { metric }
        );

        if ( ! MetricRegistry.has( metric ) ) throw new CmpStrValidationError (
            `Metric <${metric}> is not registered`, { metric, available: MetricRegistry.list() }
        );
    }

    /**
     * Validate metric options.
     * 
     * This method checks for the presence of specific metric options and validates their types.
     * 
     * @param {unknown} opt - The metric options to validate
     * @throws {CmpStrValidationError} - If any metric option is invalid
     */
    public static validateMetricOptions ( opt?: MetricOptions ) : void {
        if ( ! opt ) return;

        if ( 'mode' in opt ) this.validateMode( opt.mode );
        if ( 'delimiter' in opt ) this.validateString( opt.delimiter, 'opt.delimiter' );
        if ( 'pad' in opt ) this.validateString( opt.pad, 'opt.pad' );
        if ( 'q' in opt ) this.validateNumber( opt.q, 'opt.q' );
        if ( 'match' in opt ) this.validateNumber( opt.match, 'opt.match' );
        if ( 'mismatch' in opt ) this.validateNumber( opt.mismatch, 'opt.mismatch' );
        if ( 'gap' in opt ) this.validateNumber( opt.gap, 'opt.gap' );
    }

    /**
     * Validate phonetic algorithm against the PhoneticRegistry.
     * 
     * @param {unknown} phonetic - The phonetic algorithm name to validate
     * @throws {CmpStrValidationError} - If the phonetic algorithm is not a string or not registered
     */
    public static validatePhoneticName ( phonetic: unknown ) : void {
        if ( phonetic === undefined ) return;
        if ( typeof phonetic !== 'string' || phonetic.length === 0 ) throw new CmpStrValidationError (
            `Invalid option <phonetic>: expected non-empty string`, { phonetic }
        );

        if ( ! PhoneticRegistry.has( phonetic ) ) throw new CmpStrValidationError (
            `Phonetic algorithm <${phonetic}> is not registered`,
            { phonetic, available: PhoneticRegistry.list() }
        );
    }

    /**
     * Validate phonetic processor options.
     * 
     * @param {unknown} opt - The phonetic processor options to validate
     * @throws {CmpStrValidationError} - If any phonetic processor option is invalid
     */
    public static validatePhoneticOptions ( opt?: PhoneticOptions ) : void {
        if ( ! opt ) return;

        if ( 'map' in opt ) this.validateString( opt.map, 'opt.map' );
        if ( 'delimiter' in opt ) this.validateString( opt.delimiter, 'opt.delimiter' );
        if ( 'length' in opt ) this.validateNumber( opt.length, 'opt.length' );
        if ( 'pad' in opt ) this.validateString( opt.pad, 'opt.pad' );
        if ( 'dedupe' in opt ) this.validateBoolean( opt.dedupe, 'opt.dedupe' );
        if ( 'fallback' in opt ) this.validateString( opt.fallback, 'opt.fallback' );
    }

    /**
     * Validate phonetic processor options within the processors object.
     * 
     * @param {unknown} opt - The processors options to validate
     * @throws {CmpStrValidationError} - If any phonetic processor option is invalid
     */
    public static validatePhonetic ( opt?: CmpStrProcessors[ 'phonetic' ] ) : void {
        if ( ! opt ) return;

        this.validatePhoneticName( opt.algo );
        this.validatePhoneticOptions( opt.opt );
    }

    /**
     * Validate processor options.
     * 
     * @param {unknown} opt - The processor options to validate
     * @throws {CmpStrValidationError} - If any processor option is invalid
     */
    public static validateProcessors ( opt?: CmpStrProcessors ) : void {
        if ( ! opt ) return;

        for ( const [ key, o ] of Object.entries( opt ) ) {
            if ( OptionsValidator.ALLOWED_PROCESSORS.has( key ) ) {
                ( OptionsValidator as any )[ OptionsValidator.ALLOWED_PROCESSORS.get( key )! ]( o );
            } else {
                throw new CmpStrValidationError ( `Invalid processor type <${key}> in <processors>: expected ${
                    OptionsValidator.set2string( new Set ( OptionsValidator.ALLOWED_PROCESSORS.keys() ) )
                }`, { processors: opt, invalid: key } );
            }
        }
    }

    /**
     * Validate the provided CmpStr options object.
     * 
     * If any validation fails, a CmpStrValidationError is thrown.
     * 
     * @param {CmpStrOptions} [opt] - The options object to validate
     * @throws {CmpStrValidationError} - If any validation check fails
     */
    public static validateOptions ( opt?: CmpStrOptions ) : void {
        if ( ! opt ) return;

        if ( 'raw' in opt ) this.validateBoolean( opt.raw, 'raw' );
        if ( 'removeZero' in opt ) this.validateBoolean( opt.removeZero, 'removeZero' );
        if ( 'safeEmpty' in opt ) this.validateBoolean( opt.safeEmpty, 'safeEmpty' );
        if ( 'flags' in opt ) this.validateFlags( opt.flags );
        if ( 'metric' in opt ) this.validateMetricName( opt.metric );
        if ( 'output' in opt ) this.validateOutput( opt.output );

        if ( 'opt' in opt ) this.validateMetricOptions( opt.opt );
        if ( 'processors' in opt ) this.validateProcessors( opt.processors );
    }

}
