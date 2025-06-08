/**
 * CmpStr Main API
 * src/CmpStr.ts
 * 
 * The CmpStr class provides a comprehensive, highly abstracted, and type-safe interface
 * for string comparison, similarity measurement, phonetic indexing, filtering, normalization,
 * and text analysis. It unifies all core features of the CmpStr package and exposes a
 * consistent, user-friendly API for both single and batch operations.
 * 
 * Features:
 *   - Centralized management of metrics, phonetic algorithms, and filters
 *   - Flexible normalization and filtering pipeline for all inputs
 *   - Batch, pairwise, and single string comparison with detailed results
 *   - Phonetic indexing and phonetic-aware search and comparison
 *   - Readability and text analysis utilities
 *   - Unified diff and difference reporting
 *   - Full TypeScript type safety and extensibility
 * 
 * @module CmpStr
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { CmpStrOptions, MetricInput, MetricRaw, RegistryConstructor } from './utils/Types';

import { get, set, merge, del } from './utils/DeepMerge';
import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';
import { Profiler } from './utils/Profiler';

import { registry, resolveCls } from './utils/Registry';
import { Metric, MetricCls } from './metric';
import { Phonetic, PhoneticCls, PhoneticMappingRegistry } from './phonetic';

// Get the Profiler instance for global profiling
const profiler = Profiler.getInstance();

/**
 * The main CmpStr class that provides a unified interface for string comparison,
 * phonetic indexing, filtering, and text analysis.
 * 
 * @template R - The type of the metric result, defaults to MetricRaw
 */
export class CmpStr<R = MetricRaw> {

    /**
     * --------------------------------------------------------------------------------
     * Static methods and properties for global access to CmpStr features
     * --------------------------------------------------------------------------------
     * 
     * These static methods provide a convenient way to access the core features of
     * the CmpStr package without needing to instantiate a CmpStr object.
     */

    /**
     * Adds, removes, pauses, resumes, lists, or clears global filters.
     * 
     * @see Filter
     */
    public static readonly filter = {
        add: Filter.add,
        remove: Filter.remove,
        pause: Filter.pause,
        resume: Filter.resume,
        list: Filter.list,
        clear: Filter.clear
    };

    /**
     * Adds, removes, checks, or lists available metrics.
     * 
     * @see Metric
     */
    public static readonly metric = {
        add: registry.metric.add,
        remove: registry.metric.remove,
        has: registry.metric.has,
        list: registry.metric.list
    };

    /**
     * Adds, removes, checks, or lists available phonetic algorithms and mappings.
     * 
     * @see Phonetic
     */
    public static readonly phonetic = {
        add: registry.phonetic.add,
        remove: registry.phonetic.remove,
        has: registry.phonetic.has,
        list: registry.phonetic.list,
        map: {
            add: PhoneticMappingRegistry.add,
            remove: PhoneticMappingRegistry.remove,
            has: PhoneticMappingRegistry.has,
            list: PhoneticMappingRegistry.list
        }
    };

    /**
     * Provides access to the global profiler services.
     * 
     * @see Profiler
     */
    public static readonly profiler = profiler.services;

    /**
     * Clears the caches for normalizer, metric, and phonetic modules.
     */
    public static readonly clearCache = {
        normalizer: Normalizer.clear,
        metric: Metric.clear,
        phonetic: Phonetic.clear
    };

    /**
     * --------------------------------------------------------------------------------
     * Instance properties and methods for CmpStr operations
     * --------------------------------------------------------------------------------
     * 
     * Instance properties for managing the source input and options.
     * The main constructor for creating a CmpStr instance.
     */

    // Processor class constructors, lazily loaded
    protected processors: Record<string, new ( ...args: any[] ) => any> = Object.create( null );

    // The options for the CmpStr instance and the source input
    protected source?: MetricInput;
    protected options: CmpStrOptions = Object.create( null );

    /**
     * Constructs a new CmpStr instance.
     * 
     * @param {MetricInput} [source] - The source string or array of strings
     * @param {string} [metric] - The metric algorithm name
     * @param {CmpStrOptions} [opt] - Additional options
     */
    constructor ( source?: MetricInput, metric?: string, opt?: string | CmpStrOptions ) {

        // Set the source input if provided
        if ( source ) this.setSource( source );

        // Resolve and set the metric class if provided
        if ( metric ) this.setMetric( metric );

        // Set the options, either from a serialized string or an object
        if ( opt ) typeof opt === 'string'
            ? this.setSerializedOptions( opt )
            : this.setOptions( opt );

    }

    /**
     * ---------------------------------------------------------------------------------
     * Protected utility methods for internal use
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide utility functions for converting inputs, merging options,
     * normalizing inputs, filtering, and preparing inputs for comparison.
     */

    /**
     * Converts any input to an array of strings.
     * 
     * @param {any|any[]} input - The input value
     * @returns {any[]} - The input as an array
     */
    protected asArr ( input: any | any[] ) : any[] {

        return Array.isArray( input ) ? input : [ input ];

    }

    /**
     * Converts any input to a single string.
     * 
     * @param {any|any[]} input - The input value
     * @returns {string} - The input as a string
     */
    protected asStr ( input: any | any[], delimiter: string = ' ' ) : string {

        return String ( Array.isArray( input ) ? input.join( delimiter ) : input );

    }

    /**
     * Gets the resolved class constructor for a given processor type and name.
     * 
     * @param {T} processor - The processor type (e.g., 'metric', 'phonetic')
     * @param {string} name - The name of the processor
     * @return {T} - The resolved class constructor
     */
    protected setProcessor<T extends RegistryConstructor<any>> (
        processor: keyof typeof registry, name: string
    ) : void {

        set( this.processors, processor, resolveCls<T>( processor, name ) );

    }

    /**
     * Gets the resolved class constructor for a given processor type and name.
     * 
     * @param {T} processor - The processor type (e.g., 'metric', 'phonetic')
     */
    protected clearProcessor ( processor: keyof typeof registry ) : void {

        del( this.processors, processor );

    }

    /**
     * Checks a condition and throws if not met.
     * 
     * @param {string} cond - The condition type
     * @param {any} [test] - Optional value to test
     * @throws {Error} If the condition is not met
     */
    protected assert ( cond: string, test?: any ) : void {

        switch ( cond ) {

            // Check if the metric class is set
            case 'metric': if ( ! ( test ?? this.processors.metric ?? this.options.metric ) )
                throw new Error (
                    `CmpStr <metric> must be set, call setMetric(), ` +
                    `use CmpStr.metric.list() for available metrics`
                );
                break;

            // Check if the phonetic class is set
            case 'phonetic': if ( ! ( test ?? this.processors.phonetic ?? this.options.processors?.phonetic?.algo ) )
                throw new Error (
                    `CmpStr <phonetic> pre-processor must be set, call setPhonetic(), ` +
                    `use CmpStr.phonetic.list() for available phonetic algorithms`
                );
                break;

            // Check if the source input is set
            case 'source': if ( ! ( test ?? this.source ) )
                throw new Error (
                    `CmpStr <source> must be set, call setSource(), ` +
                    `allowed are strings or arrays of strings`
                );
                break;

            // Trow an error for unknown conditions
            default: throw new Error ( `Cmpstr condition <${cond}> unknown` );

        }

    }

    /**
     * Checks multiple conditions.
     * 
     * @param {[ string, any? ][]} cond - Array of [ condition, value ] pairs
     */
    protected assertAll ( ...cond: [ string, any? ][] ) : void {

        for ( const [ c, test ] of cond ) this.assert( c, test );

    }

    /**
     * ---------------------------------------------------------------------------------
     * Public Setters and Getters for CmpStr
     * ---------------------------------------------------------------------------------
     * 
     * These methods provides an interface to set and get properties of the CmpStr
     * instance, such as source input, options, metric, phonetic algorithm, and more.
     */

    /**
     * Sets the source string or array.
     * 
     * @param {MetricInput} source - The source input
     * @returns {this}
     */
    public setSource ( source: MetricInput ) : this { this.source = source; return this }

    /**
     * Sets the options object.
     * 
     * @param {CmpStrOptions} opt - The options
     * @returns {this}
     */
    public setOptions ( opt: CmpStrOptions ) : this { this.options = opt; return this }

    /**
     * Sets the options from a serialized JSON string.
     * 
     * @param {string} opt - The serialized options string
     * @returns {this}
     */
    public setSerializedOptions ( opt: string ) : this {

        this.options = JSON.parse( opt );
        return this;

    }

    /**
     * Sets a specific option by path.
     * 
     * @param {string} path - The path to the option
     * @param {any} value - The value to set
     * @returns {this}
     */
    public setOption ( path: string, value: any ) : this {

        set<CmpStrOptions>( this.options, path, value );
        return this;

    }

    /**
     * Deep merges and sets new options.
     * 
     * @param {CmpStrOptions} opt - The options to merge
     * @returns {this}
     */
    public mergeOptions ( opt: CmpStrOptions ) : this {

        merge<CmpStrOptions>( this.options, opt );
        return this;

    }

    /**
     * Sets the similarity metric by name.
     * 
     * @param {string} name - The metric name
     * @returns {this}
     */
    public setMetric ( name: string ) : this {

        this.setProcessor<MetricCls<R>>( 'metric', name );
        return this;

    }

    /**
     * Sets the phonetic algorithm to use as pre-processor.
     * 
     * @param {string} name - The phonetic algorithm name
     * @returns {this}
     */
    public setPhonetic ( name: string ) : this {

        this.setProcessor<PhoneticCls>( 'phonetic', name );
        return this;

    }

    /**
     * Remove the phonetic pre-processor.
     * 
     * @returns {this}
     */
    public removePhonetic () : this {

        this.clearProcessor( 'phonetic' );
        return this;

    }

    /**
     * Returns the current source input.
     * 
     * @returns {MetricInput|undefined} - The source input
     */
    public getSource () : MetricInput | undefined { return this.source; }

    /**
     * Returns the source as a single string.
     * 
     * @returns {string} - The source as a string
     */
    public getSourceAsString () : string { return this.asStr( this.source ) }

    /**
     * Returns the source as an array of strings.
     * 
     * @returns {string[]} - The source as an array
     */
    public getSourceAsArray () : string[] { return this.asArr( this.source ) }

    /**
     * Returns the current options object.
     * 
     * @returns {CmpStrOptions} - The options
     */
    public getOptions () : CmpStrOptions { return this.options }

    /**
     * Returns the options as a JSON string.
     * 
     * @returns {string} - The serialized options
     */
    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    /**
     * Returns a specific option by path, with an optional default value.
     * 
     * @param {string} path - The path to the option
     * @returns {any} - The option value or default
     */
    public getOption ( path: string ) : any {

        return get<CmpStrOptions, any>( this.options, path );

    }

    /**
     * ---------------------------------------------------------------------------------
     * Managing methods for CmpStr
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide generic functionality for cloning, resetting and checking
     * readiness for operation within the CmpStr instance.
     */

    /**
     * Creates a shallow clone of the current instance.
     * 
     * @returns {CmpStr<R>} - The cloned instance
     */
    public clone () : CmpStr<R> {

        return Object.assign(
            Object.create( Object.getPrototypeOf( this ) ),
            this
        );

    }

    /**
     * Resets the instance, clearing all data and options.
     * 
     * @returns {this}
     */
    public reset () : this {

        this.processors = {};
        this.options = {};
        this.source = undefined;

        return this;

    }

    /**
     * Checks if the instance is ready for comparison (source and metric set).
     * 
     * @returns {boolean} - True if ready, false otherwise
     */
    public isReady () : boolean {

        try { this.assertAll( [ 'source' ], [ 'metric' ] ); return true }
        catch { return false }

    }

}