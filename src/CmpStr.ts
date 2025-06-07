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
 *  - Readability and text analysis utilities
 *  - Unified diff and difference reporting
 *  - Full TypeScript type safety and extensibility
 * 
 * @module CmpStr
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    CmpStrOptions, CmpStrParams, CmpStrPhoneticParams, CmpStrResult, NormalizeFlags, DiffOptions,
    MetricInput, MetricMode, MetricRaw, MetricResult, MetricResultSingle, MetricResultBatch
} from './utils/Types';

import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';
import { DiffChecker } from './utils/DiffChecker';

import { Metric, MetricCls, MetricRegistry as metric } from './metric';
import { Phonetic, PhoneticCls, PhoneticRegistry as phonetic, PhoneticMappingRegistry } from './phonetic';

// Import the Metric and Phonetic classes and their registries
const registry = { metric, phonetic };

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
        add: metric.add,
        remove: metric.remove,
        has: metric.has,
        list: metric.list
    };

    /**
     * Adds, removes, checks, or lists available phonetic algorithms and mappings.
     * 
     * @see PhoneticRegistry
     */
    public static readonly phonetic = {
        add: phonetic.add,
        remove: phonetic.remove,
        has: phonetic.has,
        list: phonetic.list,
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
     * These properties and methods provide the core functionality of the CmpStr class,
     * allowing for string comparison, phonetic indexing, filtering, and text analysis.
     */

    // The options for the CmpStr instance, the source input, and the normalized input
    protected options: CmpStrOptions = Object.create( null );
    protected source?: MetricInput;
    protected normalized?: MetricInput;

    // The metric and phonetic instances are resolved lazily
    protected metric?: MetricCls<R>;
    protected phonetic?: PhoneticCls;

    /**
     * Constructs a new CmpStr instance.
     * 
     * @param {MetricInput} [source] - The source string or array of strings
     * @param {string} [metric] - The metric algorithm name
     * @param {CmpStrOptions} [opt] - Additional options
     * @param {string} [phonetic] - The phonetic algorithm name
     */
    constructor ( source?: MetricInput, metric?: string, opt?: CmpStrOptions, phonetic?: string ) {

        if ( source ) this.set( 'source', source );
        if ( opt ) this.set( 'options', opt );

        if ( metric ) this.set( 'metric', metric );
        if ( phonetic ) this.set( 'phonetic', phonetic );

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
    protected asStr ( input: any | any[] ) : string {

        return String ( Array.isArray( input ) ? input.join( ' ' ) : input );

    }

    /**
     * Deeply merges two objects, used for merging options.
     * 
     * @param {T} s - Source object
     * @param {T} t - Target object
     * @returns {T} - The merged object
     */
    protected deepMerge<T extends Record<string, any>> ( s: T | undefined, t: T | undefined ) : T {

        ( s as any ) ||= Object.create( null ), ( t as any ) ||= Object.create( null );

        return Object.keys( s! ).forEach(
            ( k ) => ( t as any )[ k ] = s![ k ] && typeof s![ k ] === 'object'
                ? this.deepMerge( ( t as any )[ k ], s![ k ] ) : s![ k ]
        ), t ?? {} as T;

    }

    /**
     * Normalizes the input string or array using the configured or provided flags.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @returns {MetricInput} - The normalized input
     */
    protected normalize ( input: MetricInput, flags?: NormalizeFlags ) : MetricInput {

        const { normalizeFlags } = this.options;

        return Normalizer.normalize( input, flags ?? normalizeFlags ?? '' );

    }

    /**
     * Applies all active filters to the input string or array.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {string} [hook='input'] - The filter hook
     * @returns {MetricInput} - The filtered input
     */
    protected filter ( input: MetricInput, hook: string = 'input' ) : MetricInput {

        return Array.isArray( input )
            ? input.map( s => Filter.apply( hook, s ) )
            : Filter.apply( hook, input as string );

    }

    /**
     * Prepares the input by normalizing and filtering.
     * 
     * @param {MetricInput} [input] - The input string or array
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @param {string} [hook='input'] - The filter hook
     * @returns {MetricInput|undefined} - The prepared input
     */
    protected prepare (
        input?: MetricInput, flags?: NormalizeFlags, hook: string = 'input'
    ) : MetricInput | undefined {

        return input === undefined ? undefined : (
            this.filter( this.normalize( input, flags ), hook )
        );

    }

    /**
     * Sets a property (source, options, metric, phonetic, normalized) on the instance.
     * 
     * @param {string} key - The property key
     * @param {any} val - The value to set
     * @returns {this}
     * @throws {Error} If the key is not supported
     */
    protected set ( key: string, val: any ) : this {

        switch ( key ) {

            // Set the CmpStr options
            case 'options': case 'opt': this.options = val instanceof Object ? val : {}; break;

            // Set the source input, which can be a string or an array of strings
            // Fall through to set the normalized input
            case 'source': case 'src': this.source = val;

            // Set the normalized input, which is derived from the source
            case 'normalized': this.normalized = this.normalize( val ); break;

            // Set the metric and phonetic classes
            case 'metric': case 'phonetic': this[ key ] = registry[ key ].get( val ) as any; break;

            // Throw an error if the key is not supported
            default: throw new Error ( `CmpStr key <${key}> is not supported` );

        }

        return this;

    }

    /**
     * Checks a condition and throws if not met.
     * 
     * @param {string} cond - The condition type
     * @param {any} [test] - Optional value to test
     * @throws {Error} If the condition is not met
     */
    protected condition ( cond: string, test?: any ) : void {

        switch ( cond ) {

            // Check if the metric class is set
            case 'metric': if ( ! ( test ?? this.metric ?? this.options.metric ) ) throw new Error (
                `CmpStr <metric> must be set, call setMetric(), ` +
                `use CmpStr.metric.list() for available metrics`
            ); break;

            // Check if the phonetic class is set
            case 'phonetic': if ( ! ( test ?? this.phonetic ?? this.options.phonetic ) ) throw new Error (
                `CmpStr <phonetic> must be set, call setPhonetic(), ` +
                `use CmpStr.phonetic.list() for available phonetic algorithms`
            );

            // Check if the source or normalized input is set
            case 'source': case 'normalized': if ( ! ( test ?? this.source ) ) throw new Error (
                `CmpStr <source> must be set, call setSource(), ` +
                `allowed are strings or arrays of strings`
            ); break;

            // Trow an error for unknown conditions
            default: throw new Error ( `Cmpstr condition <${cond}> unknown` );

        }

    }

    /**
     * Checks multiple conditions.
     * 
     * @param {[ string, any? ][]} cond - Array of [ condition, value ] pairs
     */
    protected check ( ...cond: [ string, any? ][] ) : void {

        for ( const [ c, t ] of cond ) this.condition( c, t );

    }

    /**
     * Resolves a metric or phonetic class from registry or instance.
     * 
     * @param {'metric'|'phonetic'} reg - Registry type
     * @param {string|T} [cls] - Class name or instance
     * @returns {T} - The resolved class
     */
    protected resolveCls<T extends MetricCls<R> | PhoneticCls> (
        reg: 'metric' | 'phonetic', cls?: string | T
    ) : T {

        return ( typeof cls === 'string' ? registry[ reg ].get( cls )
            : cls ?? this[ reg ] ?? registry[ reg ].get( this.options[ reg ]! )
        ) as T;

    }

    /**
     * Resolves the result format (raw or simplified).
     * 
     * @param {MetricResult<R>} result - The metric result
     * @param {boolean} [raw] - Whether to return raw results
     * @returns {T} - The resolved result
     */
    protected resolveResult<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        result: MetricResult<R>, raw?: boolean
    ) : T {

        return ( raw ?? this.options.raw ? result : Array.isArray( result )
            ? result.map( r => ( { source: r.a, target: r.b, match: r.res } ) )
            : { source: result.a, target: result.b, match: result.res }
        ) as T;

    }

    /**
     * Computes a metric result for the given target and mode.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {CmpStrParams} [args] - Additional parameters
     * @param {MetricMode} [mode] - The optional metric mode
     * @returns {T} - The computed result
     */
    protected compute<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        target: MetricInput, args?: CmpStrParams, mode?: MetricMode
    ) : T {

        const { flags, opt, raw, metric, source } = args ?? {};

        // Prepare the source and target inputs, resolving the metric class
        const src: MetricInput | undefined = this.prepare( source ?? this.source, flags );
        const tgt: MetricInput = this.prepare( target ?? '' )!;
        const cls: MetricCls<R> = this.resolveCls<MetricCls<R>>( 'metric', metric );

        this.check( [ 'source', src ], [ 'metric', cls ] );

        // Get a new instance of the metric class with merged options
        const cmp = new cls! ( src, tgt, this.deepMerge( this.options.metricOptions, opt ) );

        // Compute the metric result
        cmp.run( mode );

        // Resolve and return the result based on the raw flag
        return this.resolveResult<T>( cmp.getResults(), raw ) as T;

    }

    /**
     * Computes the phonetic index for a string using the configured algorithm.
     * 
     * @param {string} [input] - The input string
     * @param {CmpStrPhoneticParams} [args] - Phonetic options
     * @returns {string[]} - The phonetic index as an array of codes
     */
    protected index ( input?: string, args?: CmpStrPhoneticParams ) : string[] {

        const { flags, opt, algo } = args ?? {};

        // Prepare the input string, resolving the phonetic class
        const src: string = this.prepare( this.asStr( input ?? this.source ?? '' ), flags ) as string;
        const cls: PhoneticCls = this.resolveCls<PhoneticCls>( 'phonetic', algo );

        this.check( [ 'source', src ], [ 'phonetic', cls ] );

        // Get a new instance of the phonetic class with merged options
        const phonetic = new cls! ( this.deepMerge( this.options.phoneticOptions, opt ) );

        // Compute the phonetic index and return it
        return phonetic.getIndex( src );

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
    public setSource ( source: MetricInput ) : this { return this.set( 'source', source ) }

    /**
     * Sets the options object.
     * 
     * @param {CmpStrOptions} opt - The options
     * @returns {this}
     */
    public setOptions ( opt: CmpStrOptions ) : this { return this.set( 'options', opt ) }

    /**
     * Deep merges and sets new options.
     * 
     * @param {CmpStrOptions} opt - The options to merge
     * @returns {this}
     */
    public mergeOptions ( opt: CmpStrOptions ) : this {

        return this.set( 'options', this.deepMerge<CmpStrOptions>( this.options, opt ) );

    }

    /**
     * Sets the metric class by name.
     * 
     * @param {string} name - The metric name
     * @returns {this}
     */
    public setMetric ( name: string ) : this { return this.set( 'metric', name ) }

    /**
     * Sets the phonetic class by name.
     * 
     * @param {string} name - The phonetic algorithm name
     * @returns {this}
     */
    public setPhonetic ( name: string ) : this { return this.set( 'phonetic', name ) }

    /**
     * Returns the current source input.
     * 
     * @returns {MetricInput|undefined} - The source input
     */
    public getSource () : MetricInput | undefined { return this.source }

    /**
     * Returns the normalized source input.
     * 
     * @returns {MetricInput|undefined} - The normalized source
     */
    public getNormalizedSource () : MetricInput | undefined { return this.normalized }

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
     * Returns a specific option value.
     * 
     * @param {keyof CmpStrOptions} key - The option key
     * @returns {any} - The option value
     */
    public getOption ( key: keyof CmpStrOptions ) : any { return this.options[ key ] }

    /**
     * Returns the options as a JSON string.
     * 
     * @returns {string} - The serialized options
     */
    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

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

        return Object.assign( Object.create( Object.getPrototypeOf( this ) ), this );

    }

    /**
     * Resets the instance, clearing all data and options.
     * 
     * @returns {this}
     */
    public reset () : this {

        this.source = undefined;
        this.normalized = undefined;
        this.options = {};

        this.metric = undefined;
        this.phonetic = undefined;

        return this;

    }

    /**
     * Checks if the instance is ready for comparison (source and metric set).
     * 
     * @returns {boolean} - True if ready, false otherwise
     */
    public isReady () : boolean {

        try { this.check( [ 'source' ], [ 'metric' ] ); return true }
        catch { return false }

    }

    /**
     * ---------------------------------------------------------------------------------
     * Public methods for string comparison, phonetic indexing, and text analysis
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide the core functionality of the CmpStr class, allowing for
     * string comparison, phonetic indexing, filtering, and text analysis.
     */

    /**
     * Performs a single metric comparison between the source and target.
     * 
     * @param {string} target - The target string
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The metric result
     */
    public test<T extends CmpStrResult | MetricResultSingle<R>> (
        target: string, args?: CmpStrParams
    ) : T {

        return this.compute<T>( target, args, 'single' ) as T;

    }

    /**
     * Performs a single metric comparison and returns only the numeric score.
     * 
     * @param {string} target - The target string
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {number} - The similarity score (0..1)
     */
    public compare ( target: string, args?: CmpStrParams ) : number {

        return this.compute<MetricResultSingle<R>>( target, {
            ...args, ...{ raw: true }
        }, 'single' ).res;

    }

    /**
     * Performs a batch metric comparison between the source and target string or array.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The batch metric results
     */
    public batchTest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, args?: CmpStrParams
    ) : T {

        return this.compute<T>( target, args, 'batch' ) as T;

    }

    /**
     * Performs a batch metric comparison and returns results sorted by score.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {'desc'|'asc'} [dir='desc'] - Sort direction
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The sorted batch results
     */
    public batchSorted<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, dir: 'desc' | 'asc' = 'desc', args?: CmpStrParams
    ) : T {

        return this.resolveResult(
            this.batchTest<MetricResultBatch<R>>( target, { ...args, ...{ raw: true } } )
                .sort( ( a, b ) => dir === 'asc' ? a.res - b.res : b.res - a.res ),
            args?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Performs a pairwise metric comparison between the source and target arrays.
     * 
     * @param {MetricInput} target - The target array
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The pairwise metric results
     */
    public pairs<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, args?: CmpStrParams
    ) : T {

        return this.compute<T>( target, args, 'pairwise' ) as T;

    }

    /**
     * Performs a batch comparison and returns only results above the threshold.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {number} threshold - The similarity threshold (0..1)
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The filtered batch results
     */
    public match<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, threshold: number, args?: CmpStrParams
    ) : T {

        return this.resolveResult(
            this.batchTest<MetricResultBatch<R>>( target, { ...args, ...{ raw: true } } )
                .filter( r => r.res >= threshold ).sort( ( a, b ) => b.res - a.res ),
            args?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Returns the n closest matches from a batch comparison.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {number} [n=1] - Number of closest matches
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The closest matches
     */
    public closest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, n: number = 1, args?: CmpStrParams
    ) : T {

        return this.batchSorted( target, 'desc', args ).slice( 0, n ) as T;

    }

    /**
     * Returns the n furthest matches from a batch comparison.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {number} [n=1] - Number of furthest matches
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {T} - The furthest matches
     */
    public furthest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, n: number = 1, args?: CmpStrParams
    ) : T {

        return this.batchSorted( target, 'asc', args ).slice( 0, n ) as T;

    }

    /**
     * Performs a normalized and filtered substring search.
     * 
     * @param {string} needle - The search string
     * @param {string[]} [haystack] - The array to search in (defaults to source)
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @returns {string[]} - Array of matching entries
     */
    public search ( needle: string, haystack?: string[], flags?: NormalizeFlags ) : string[] {

        this.check( [ 'source', haystack ] );

        // Prepare the needle and haystack, normalizing and filtering them
        const test: string = this.prepare( needle, flags ) as string;
        const src: string[] = this.asArr( haystack ?? this.source );
        const hstk: string[] = this.prepare( src, flags ) as string[];

        // Filter the haystack based on the normalized test string
        return src.filter( ( _, i ) => hstk[ i ].includes( test ) );

    }

    /**
     * Computes a similarity matrix for the given input array.
     * 
     * @param {string[]} input - The input array
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {number[][]} - The similarity matrix
     */
    public matrix ( input: string[], args?: CmpStrParams ) : number[][] {

        input = this.prepare( input, args?.flags ) as string[];

        return input.map( a => input.map( b => (
            this.compute<MetricResultSingle<R>>(
                b, { flags: '', raw: true, source: a }, 'single'
            ).res ?? 0
        ) ) );

    }

    /**
     * Computes the phonetic index for a string using the configured algorithm.
     * 
     * @param {string} [input] - The input string
     * @param {CmpStrPhoneticParams} [args] - Phonetic options
     * @returns {string} - The phonetic index as a string
     */
    public phoneticIndex ( input?: string, args?: CmpStrPhoneticParams ) : string {

        return this.index( input, args ).join( ' ' );

    }

    /**
     * Returns a text analyzer for the source input or a given string.
     * 
     * @param {string} [input] - The input string
     * @returns {TextAnalyzer} - The text analyzer
     */
    public analyze ( input?: string ) : TextAnalyzer {

        this.check( [ 'source', input ] );

        return new TextAnalyzer ( this.asStr( input ?? this.source ) );

    }

    /**
     * Computes a unified diff between the source and target.
     * 
     * @param {string} target - The target string
     * @param {DiffOptions} [opt] - Diff options
     * @param {string} [source] - Optional source override
     * @returns {DiffChecker} - The diff checker instance
     */
    public diff ( target: string, opt?: DiffOptions, source?: string ) : DiffChecker {

        this.check( [ 'source', source ] );

        return new DiffChecker (
            this.asStr( source ?? this.source ), target,
            this.deepMerge<DiffOptions>( this.options.diffOptions, opt )
        );

    }

}