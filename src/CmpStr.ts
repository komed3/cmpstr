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
 *  - Centralized management of metrics, phonetic algorithms, and filters
 *  - Flexible normalization and filtering pipeline for all inputs
 *  - Batch, pairwise, and single string comparison with detailed results
 *  - Phonetic indexing and phonetic-aware search and comparison
 *  - Text analysis and unified diff utilities
 *  - Full TypeScript type safety and extensibility
 * 
 * @module CmpStr
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    CmpStrOptions, CmpStrProcessors, CmpStrResult, NormalizeFlags, DiffOptions, PhoneticOptions,
    MetricRaw, MetricInput, MetricMode, MetricResult, MetricResultSingle, MetricResultBatch,
    StructuredDataBatchResult, StructuredDataOptions
} from './utils/Types';

import * as DeepMerge from './utils/DeepMerge';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';
import { DiffChecker } from './utils/DiffChecker';
import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';
import { StructuredData } from './utils/StructuredData';

import { factory } from './utils/Registry';
import { MetricRegistry, Metric } from './metric';
import { PhoneticRegistry, PhoneticMappingRegistry, Phonetic } from './phonetic';

// Import the Profiler instance for global profiling
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
     * @see MetricRegistry
     */
    public static readonly metric = {
        add: MetricRegistry.add,
        remove: MetricRegistry.remove,
        has: MetricRegistry.has,
        list: MetricRegistry.list
    };

    /**
     * Adds, removes, checks, or lists available phonetic algorithms and mappings.
     * 
     * @see PhoneticRegistry
     */
    public static readonly phonetic = {
        add: PhoneticRegistry.add,
        remove: PhoneticRegistry.remove,
        has: PhoneticRegistry.has,
        list: PhoneticRegistry.list,
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
     * Returns a TextAnalyzer instance for the given input string.
     * 
     * @param {string} [input] - The input string
     * @returns {TextAnalyzer} - The text analyzer
     */
    public static analyze ( input: string ) : TextAnalyzer { return new TextAnalyzer ( input ) }

    /**
     * Returns a DiffChecker instance for computing the unified diff between two texts.
     * 
     * @param {string} a - The first (original) text
     * @param {string} b - The second (modified) text
     * @param {DiffOptions} [opt] - Optional diff configuration
     * @returns {DiffChecker} - The diff checker instance
     */
    public static diff ( a: string, b: string, opt?: DiffOptions ) : DiffChecker { return new DiffChecker ( a, b, opt ) }

    /**
     * --------------------------------------------------------------------------------
     * Instanciate the CmpStr class
     * --------------------------------------------------------------------------------
     * 
     * Methods to create a new CmpStr instance with the given options.
     * Using the static `create` method is recommended to ensure proper instantiation.
     */

    /**
     * Creates a new CmpStr instance with the given options.
     * 
     * @param {string|CmpStrOptions} [opt] - Optional serialized or options object
     * @returns {CmpStr<R>} - A new CmpStr instance
     */
    public static create<R = MetricRaw> ( opt?: string | CmpStrOptions ) : CmpStr<R> { return new CmpStr ( opt ) }

    // The options object that holds the configuration for this CmpStr instance
    protected options: CmpStrOptions = Object.create( null );

    /**
     * Creates a new CmpStr instance with the given options.
     * The constructor is protected to enforce the use of the static `create` method.
     * 
     * @param {string|CmpStrOptions} [opt] - Optional serialized or options object
     */
    protected constructor ( opt?: string | CmpStrOptions ) {

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
     * Assert a condition and throws if the condition is not met.
     * 
     * @param {string} cond - The condition to met
     * @param {any} [test] - Value to test for
     * @throws {Error} If the condition is not met
     */
    protected assert ( cond: string, test?: any ) : void {

        switch ( cond ) {

            // Check if the metric exists
            case 'metric': if ( ! CmpStr.metric.has( test ) ) throw new Error (
                `CmpStr <metric> must be set, call .setMetric(), ` +
                `use CmpStr.metric.list() for available metrics`
            ); break;

            // Check if the phonetic algorithm exists
            case 'phonetic': if ( ! CmpStr.phonetic.has( test ) ) throw new Error (
                `CmpStr <phonetic> must be set, call .setPhonetic(), ` +
                `use CmpStr.phonetic.list() for available phonetic algorithms`
            ); break;

            // Throw an error for unknown conditions
            default: throw new Error ( `Cmpstr condition <${cond}> unknown` );

        }

    }

    /**
     * Assert multiple conditions.
     * 
     * @param {[ string, any? ][]} cond - Array of [ condition, value ] pairs
     */
    protected assertMany ( ...cond: [ string, any? ][] ) : void {

        for ( const [ c, test ] of cond ) this.assert( c, test );

    }

    /**
     * Resolves the options for the CmpStr instance, merging the provided options with
     * the existing options.
     * 
     * @param {CmpStrOptions} [opt] - Optional options to merge
     * @returns {CmpStrOptions} - The resolved options
     */
    protected resolveOptions ( opt?: CmpStrOptions ) : CmpStrOptions {

        return DeepMerge.merge( { ...( this.options ?? Object.create( null ) ) }, opt );

    }

    /**
     * Normalizes the input string or array using the configured or provided flags.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @returns {MetricInput} - The normalized input
     */
    protected normalize ( input: MetricInput, flags?: NormalizeFlags ) : MetricInput {

        return Normalizer.normalize( input, flags ?? this.options.flags ?? '' );

    }

    /**
     * Applies all active filters to the input string or array.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {string} [hook='input'] - The filter hook
     * @returns {MetricInput} - The filtered string(s)
     */
    protected filter ( input: MetricInput, hook: string ) : MetricInput {

        return Filter.apply( hook, input as string );

    }

    /**
     * Prepares the input by normalizing and filtering.
     * 
     * @param {MetricInput} [input] - The input string or array
     * @param {CmpStrOptions} [opt] - Optional options to use
     * @returns {MetricInput} - The prepared input
     */
    protected prepare ( input: MetricInput, opt?: CmpStrOptions ) : MetricInput {

        const { flags, processors } = opt ?? this.options;

        // Normalize the input using flags (i.e., 'itw')
        if ( flags?.length ) input = this.normalize( input, flags );

        // Filter the input using hooked up filters
        input = this.filter( input, 'input' );

        // Apply phonetic processors if configured
        if ( processors?.phonetic ) input = this.index( input, processors.phonetic );

        return input;

    }

    /**
     * Post-process the results of the metric computation.
     * 
     * @param {MetricResult<R>} result - The metric result
     * @returns {MetricResult<R>} - The post-processed results
     */
    protected postProcess (
        result: MetricResult<R>, opt?: CmpStrOptions
    ) : MetricResult<R> {

        // Remove "zero similarity" from batch results if configured
        if ( opt?.removeZero && Array.isArray( result ) ) result = result.filter( r => r.res > 0 );

        return result;

    }

    /**
     * Computes the phonetic index for the given input using the specified phonetic algorithm.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {{ algo: string, opt?: PhoneticOptions }} options - The phonetic algorithm and options
     * @returns {MetricInput} - The phonetic index for the given input
     */
    protected index ( input: MetricInput, { algo, opt }: {
        algo: string, opt?: PhoneticOptions
    } ) : MetricInput {

        this.assert( 'phonetic', algo );

        const phonetic: Phonetic = factory.phonetic( algo, opt );
        const delimiter = opt?.delimiter ?? ' ';

        return Array.isArray( input )
            ? input.map( s => phonetic.getIndex( s ).join( delimiter ) )
            : phonetic.getIndex( input ).join( delimiter );

    }

    /**
     * Creates a instance for processing structured data.
     * 
     * @template T - The type of objects in the data array
     * @param {T[]} data - The array of structured objects
     * @param {string|number|symbol} key - The property key to compare
     * @returns {StructuredData<T, R>} - The lookup instance
     */
    protected structured<T = any> ( data: T[], key: string | number | symbol ) : StructuredData<T, R> {

        return StructuredData.create<T, R>( data, key );

    }

    /**
     * Computes the metric result for the given inputs, applying normalization and
     * filtering as configured.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The first input string or array
     * @param {MetricInput} b - The second input string or array
     * @param {CmpStrOptions} [opt] - Optional options to use
     * @param {MetricMode} [mode='single'] - The metric mode to use
     * @param {boolean} [raw=false] - Whether to return raw results
     * @param {boolean} [skip=false] - Whether to skip normalization and filtering
     * @returns {T} - The computed metric result
     */
    protected compute<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions,
        mode?: MetricMode, raw?: boolean, skip?: boolean
    ) : T {

        const resolved: CmpStrOptions = this.resolveOptions( opt );

        this.assert( 'metric', resolved.metric );

        // Prepare the input
        const A: MetricInput = skip ? a : this.prepare( a, resolved );
        const B: MetricInput = skip ? b : this.prepare( b, resolved );

        // If the inputs are empty and safeEmpty is enabled, return an empty array
        if ( resolved.safeEmpty && (
            ( Array.isArray( A ) && A.length === 0 ) ||
            ( Array.isArray( B ) && B.length === 0 ) ||
            A === '' || B === ''
        ) ) { return ( [] as unknown ) as T }

        // Get the metric class
        const metric: Metric<R> = factory.metric( resolved.metric!, A, B, resolved.opt );

        // Pass the original inputs to the metric
        if ( resolved.output !== 'prep' ) metric.setOriginal( a, b );

        // Compute the metric result
        metric.run( mode );

        // Post-process the results
        const result = this.postProcess( metric.getResults(), resolved );

        // Resolve and return the result based on the raw flag
        return this.output<T>( result, raw ?? resolved.raw );

    }

    /**
     * Resolves the result format (raw or formatted).
     * 
     * @template T - The type of the metric result
     * @param {MetricResult<R>} result - The metric result
     * @param {boolean} [raw] - Whether to return raw results
     * @returns {T} - The resolved result
     */
    protected output<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        result: MetricResult<R>, raw?: boolean
    ) : T {

        return ( raw ?? this.options.raw ? result : Array.isArray( result )
            ? result.map( r => ( { source: r.a, target: r.b, match: r.res } ) )
            : { source: result.a, target: result.b, match: result.res }
        ) as T;

    }

    /**
     * ---------------------------------------------------------------------------------
     * Managing methods for CmpStr
     * ---------------------------------------------------------------------------------
     * 
     * These methods provides an interface to set and get properties of the CmpStr
     * instance, such as options, metric, phonetic algorithm, and more.
     */

    /**
     * Creates a shallow clone of the current instance.
     * 
     * @returns {CmpStr<R>} - The cloned instance
     */
    public clone () : CmpStr<R> { return Object.assign( Object.create( Object.getPrototypeOf( this ) ), this ) }

    /**
     * Resets the instance, clearing all data and options.
     * 
     * @returns {this}
     */
    public reset () : this { for ( const k in this.options ) delete ( this.options as any )[ k ]; return this }

    /**
     * Sets / replaces the full options object.
     * 
     * @param {CmpStrOptions} opt - The options
     * @returns {this}
     */
    public setOptions ( opt: CmpStrOptions ) : this { this.options = opt; return this }

    /**
     * Deep merges and sets new options.
     * 
     * @param {CmpStrOptions} opt - The options to merge
     * @returns {this}
     */
    public mergeOptions ( opt: CmpStrOptions ) : this { DeepMerge.merge( this.options, opt ); return this }

    /**
     * Sets the serialized options from a JSON string.
     * 
     * @param {string} opt - The serialized options
     * @returns {this}
     */
    public setSerializedOptions ( opt: string ) : this { this.options = JSON.parse( opt ); return this }

    /**
     * Sets a specific option at the given path.
     * 
     * @param {string} path - The path to the option
     * @param {any} value - The value to set
     * @returns {this}
     */
    public setOption ( path: string, value: any ) : this { DeepMerge.set( this.options, path, value ); return this }

    /**
     * Removes an option at the given path.
     * 
     * @param {string} path - The path to the option
     * @returns {this}
     */
    public rmvOption ( path: string ) : this { DeepMerge.rmv( this.options, path ); return this }

    /**
     * Enable or disable raw output.
     * 
     * @param {boolean} enable - Whether to enable or disable raw output
     * @returns {this}
     */
    public setRaw ( enable: boolean ) : this { return this.setOption( 'raw', enable ) }

    /**
     * Sets the similatity metric to use (e.g., 'levenshtein', 'dice').
     * 
     * @param {string} name - The metric name
     * @returns {this}
     */
    public setMetric ( name: string ) : this { return this.setOption( 'metric', name ) }

    /**
     * Sets the normalization flags (e.g., 'itw', 'nfc').
     * 
     * @param {NormalizeFlags} flags - The normalization flags
     * @returns {this}
     */
    public setFlags ( flags: NormalizeFlags ) : this { return this.setOption( 'flags', flags ) }

    /**
     * Removes the normalization flags entirely.
     * 
     * @return {this}
     */
    public rmvFlags () : this { return this.rmvOption( 'flags' ) }

    /**
     * Sets the pre-processors to use for preparing the input.
     * 
     * @param {CmpStrProcessors} opt - The processors to set
     * @returns {this}
     */
    public setProcessors ( opt: CmpStrProcessors ) : this { return this.setOption( 'processors', opt ) }

    /**
     * Removes the processors entirely.
     * 
     * @returns {this}
     */
    public rmvProcessors () : this { return this.rmvOption( 'processors' ) }

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
     * Returns a specific option value by path.
     * 
     * @param {string} path - The path to the option
     * @returns {any} - The option value
     */
    public getOption ( path: string ) : any { return DeepMerge.get( this.options, path ) }

    /**
     * ---------------------------------------------------------------------------------
     * Public core methods for string comparison
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide the core functionality of the CmpStr class, allowing for
     * string comparison, phonetic indexing, filtering, and text search.
     */

    /**
     * Performs a single metric comparison between the source and target.
     * 
     * @template T - The type of the metric result
     * @param {string} a - The source string
     * @param {string} b - The target string
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The metric result
     */
    public test<T extends CmpStrResult | MetricResultSingle<R>> (
        a: string, b: string, opt?: CmpStrOptions
    ) : T {

        return this.compute<T>( a, b, opt, 'single' );

    }

    /**
     * Performs a single metric comparison and returns only the numeric score.
     * 
     * @param {string} a - The source string
     * @param {string} b - The target string
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {number} - The similarity score (0..1)
     */
    public compare ( a: string, b: string, opt?: CmpStrOptions ) : number {

        return this.compute<MetricResultSingle<R>>( a, b, opt, 'single', true ).res;

    }

    /**
     * Performs a batch metric comparison between source and target strings
     * or array of strings.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The batch metric results
     */
    public batchTest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : T {

        return this.compute<T>( a, b, opt, 'batch' );

    }

    /**
     * Performs a batch metric comparison and returns results sorted by score.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {'desc'|'asc'} [dir='desc'] - Sort direction (desc, asc)
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The sorted batch results
     */
    public batchSorted<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, dir: 'desc' | 'asc' = 'desc', opt?: CmpStrOptions
    ) : T {

        return this.output(
            this.compute<MetricResultBatch<R>>( a, b, opt, 'batch', true )
                .sort( ( a, b ) => dir === 'asc' ? a.res - b.res : b.res - a.res ),
            opt?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Performs a pairwise metric comparison between source and target strings
     * or array of strings.
     * 
     * Input arrays needs of the same length to perform pairwise comparison,
     * otherwise the method will throw an error.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The pairwise metric results
     */
    public pairs<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : T {

        return this.compute<T>( a, b, opt, 'pairwise' );

    }

    /**
     * Performs a batch comparison and returns only results above the threshold.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {number} threshold - The similarity threshold (0..1)
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The filtered batch results
     */
    public match<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, threshold: number, opt?: CmpStrOptions
    ) : T {

        return this.output(
            this.compute<MetricResultBatch<R>>( a, b, opt, 'batch', true )
                .filter( r => r.res >= threshold ).sort( ( a, b ) => b.res - a.res ),
            opt?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Returns the n closest matches from a batch comparison.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {number} [n=1] - Number of closest matches
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The closest matches
     */
    public closest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, n: number = 1, opt?: CmpStrOptions
    ) : T {

        return this.batchSorted( a, b, 'desc', opt ).slice( 0, n ) as T;

    }

    /**
     * Returns the n furthest matches from a batch comparison.
     * 
     * @template T - The type of the metric result
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {number} [n=1] - Number of furthest matches
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {T} - The furthest matches
     */
    public furthest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, n: number = 1, opt?: CmpStrOptions
    ) : T {

        return this.batchSorted( a, b, 'asc', opt ).slice( 0, n ) as T;

    }

    /**
     * Performs a normalized and filtered substring search.
     * 
     * @param {string} needle - The search string
     * @param {string[]} haystack - The array to search in
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @param {CmpStrProcessors} [processors] - Pre-processors to apply
     * @returns {string[]} - Array of matching entries
     */
    public search (
        needle: string, haystack: string[], flags?: NormalizeFlags,
        processors?: CmpStrProcessors
    ) : string[] {

        const resolved: CmpStrOptions = this.resolveOptions( { flags, processors } );

        // Prepare the needle and haystack, normalizing and filtering them
        const test: string = this.prepare( needle, resolved ) as string;
        const hstk: string[] = this.prepare( haystack, resolved ) as string[];

        // Filter the haystack based on the normalized test string
        return haystack.filter( ( _, i ) => hstk[ i ].includes( test ) );

    }

    /**
     * Computes a similarity matrix for the given input array.
     * 
     * @param {string[]} input - The input array
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {number[][]} - The similarity matrix
     */
    public matrix ( input: string[], opt?: CmpStrOptions ) : number[][] {

        input = this.prepare( input, this.resolveOptions( opt ) ) as string[];

        return input.map( a => this.compute<MetricResultBatch<R>>(
            a, input, undefined, 'batch', true, true
        ).map( b => b.res ?? 0 ) );

    }

    /**
     * Computes the phonetic index for a string using the configured
     * or given algorithm.
     * 
     * @param {string} [input] - The input string
     * @param {string} [algo] - The phonetic algorithm to use
     * @param {PhoneticOptions} [opt] - Optional phonetic options
     * @returns {string} - The phonetic index as a string
     */
    public phoneticIndex ( input: string, algo?: string, opt?: PhoneticOptions ) : string {

        const { algo: a, opt: o } = this.options.processors?.phonetic ?? {};

        return this.index( input, { algo: ( algo ?? a )!, opt: opt ?? o } ) as string;

    }

    /**
     * ---------------------------------------------------------------------------------
     * Public methods for structured data comparison
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide interfaces for comparing arrays of structured objects
     * by extracting and comparing specific properties.
     */

    /**
     * Performs a batch comparison against structured data by extracting
     * a specific property and returning results with original objects attached.
     * 
     * @template T - The type of objects in the data array
     * @param {string} query - The query string to compare against
     * @param {T[]} data - The array of structured objects
     * @param {string|number|symbol} key - The property key to extract for comparison
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult<T, R>} - Batch results with original objects
     */
    public structuredLookup<T = any> (
        query: string, data: T[], key: string | number | symbol, opt?: StructuredDataOptions
    ) : StructuredDataBatchResult<T, R> | T[] {

        return this.structured<T>( data, key ).lookup(
            query,
            ( q, items, options ) => this.batchTest<MetricResultBatch<R>>( q, items, options ),
            opt
        );

    }

    /**
     * Performs a batch comparison and returns only results above the threshold
     * for structured data.
     * 
     * @template T - The type of objects in the data array
     * @param {string} query - The query string to compare against
     * @param {T[]} data - The array of structured objects
     * @param {string|number|symbol} key - The property key to extract for comparison
     * @param {number} threshold - The similarity threshold (0..1)
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult<T, R>} - Filtered batch results with objects
     */
    public structuredMatch<T = any> (
        query: string, data: T[], key: string | number | symbol, threshold: number,
        opt?: StructuredDataOptions
    ) : StructuredDataBatchResult<T, R> | T[] {

        return this.structured<T>( data, key ).lookup(
            query,
            ( q, items, options ) => this.match<MetricResultBatch<R>>( q, items, threshold, options ),
            { ...opt, sort: 'desc' }
        );

    }

    /**
     * Performs a pairwise comparison between two arrays of structured objects
     * by extracting specific properties and returning results with original objects attached.
     * 
     * @template T - The type of objects in the arrays
     * @param {T[]} data - The array of structured objects
     * @param {string|number|symbol} key - The property key to extract for comparison
     * @param {T[]} other - The other array of structured objects
     * @param {string|number|symbol} otherKey - The property key to extract from other array
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult<T, R>} - Pairwise results with original objects
     */
    public structuredPairs<T = any> (
        data: T[], key: string | number | symbol, other: T[], otherKey: string | number | symbol,
        opt?: StructuredDataOptions
    ) : StructuredDataBatchResult<T, R> | T[] {

        return this.structured<T>( data, key ).lookupPairs(
            other, otherKey,
            ( items, otherItems, options ) => this.pairs<MetricResultBatch<R>>( items, otherItems, options ),
            opt
        );

    }

}
