/**
 * Abstract Metric
 * src/metric/Metric.ts
 * 
 * This module defines an abstract class for string metrics, providing a framework for
 * computing various string similarity metrics. It includes methods for running metrics
 * in different modes (single, batch, pairwise) synchronous or asynchronous and caching
 * results to optimize performance. The class is designed to be extended by specific
 * metric implementations like the Levenshtein distance or Jaro-Winkler similarity.
 * 
 * It provides:
 *  - A base class for string metrics with common functionality
 *  - Methods for running metrics in different modes
 *  - Pre-computation for trivial cases to optimize performance
 *  - Caching of metric computations to avoid redundant calculations
 *  - Support for symmetrical metrics (same result for inputs in any order)
 *  - Performance tracking capabilities (Profiler)
 *  - Asynchronous execution support for metrics
 * 
 * This class is intended to be extended by specific metric implementations that will
 * implement the `compute` method to define the specific metric computation logic.
 * 
 * @module Metric
 * @name Metric
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    MetricCompute, MetricInput, MetricMode, MetricOptions, MetricRaw, MetricResult,
    MetricResultBatch, MetricResultSingle, RegistryService
} from '../utils/Types';

import { Hasher, HashTable } from '../utils/HashTable';
import { Profiler } from '../utils/Profiler';
import { Registry } from '../utils/Registry';

// Get the singleton profiler instance for performance monitoring
const profiler = Profiler.getInstance();

/**
 * Abstract class representing a generic string metric.
 * 
 * @abstract
 * @template R - The type of the raw result, defaulting to `MetricRaw`.
 */
export abstract class Metric< R = MetricRaw > {

    /** Cache for metric computations to avoid redundant calculations */
    private static cache: HashTable< string, MetricCompute< any > > = new HashTable ();

    /** Metric name for identification */
    private readonly metric: string;

    /** Inputs for the metric computation, transformed into arrays */
    private readonly a: string[];
    private readonly b: string[];

    /** Store original inputs for result mapping */
    private origA: string[] = [];
    private origB: string[] = [];

    /** Options for the metric computation, such as performance tracking */
    protected readonly options: MetricOptions;
    protected readonly optKey: string;

    /** Indicates whether the metric is symmetric (same result for inputs in any order) */
    protected readonly symmetric: boolean;

    /**
     * Result of the metric computation, which can be a single result or an array of results.
     * This will be populated after running the metric.
     */
    private results: MetricResult< R > | undefined;

    /**
     * Static method to clear the cache of metric computations.
     */
    public static clear = () : void => this.cache.clear();

    /**
     * Swaps two strings and their lengths if the first is longer than the second.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @returns {[ string, string, number, number ]} - Swapped strings and lengths
     */
    protected static swap = ( a: string, b: string, m: number, n: number ) : [
        string, string, number, number
    ] => m > n ? [ b, a, n, m ] : [ a, b, m, n ];

    /**
     * Clamps the similarity result between 0 and 1.
     * 
     * @param {number} res - The input similarity to clamp
     * @returns {number} - The clamped similarity (0 to 1)
     */
    protected static clamp = ( res: number ) : number => Math.max( 0, Math.min( 1, res ) );

    /**
     * Constructor for the Metric class.
     * Initializes the metric with two inputs (strings or arrays of strings) and options.
     * 
     * @param {string} metric - The name of the metric (e.g. 'levenshtein')
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} [opt] - Options for the metric computation
     * @param {boolean} [symmetric=false] - Whether the metric is symmetric (same result for inputs in any order)
     * @throws {Error} - If inputs `a` or `b` are empty
     */
    constructor (
        metric: string, a: MetricInput, b: MetricInput,
        opt: MetricOptions = {}, symmetric: boolean = false
    ) {
        // Set the metric name
        this.metric = metric;

        // Set the inputs
        this.a = Array.isArray( a ) ? a : [ a ];
        this.b = Array.isArray( b ) ? b : [ b ];

        // Validate inputs: ensure they are not empty
        if ( this.a.length === 0 || this.b.length === 0 ) throw new Error (
            `Inputs <a> and <b> must not be empty`
        );

        // Set options
        this.options = opt;
        this.optKey = Hasher.fastFNV1a( JSON.stringify( opt, Object.keys( opt ).sort() ) ).toString();
        this.symmetric = symmetric;
    }

    /**
     * Pre-compute the metric for two strings.
     * This method is called before the actual computation to handle trivial cases.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @returns {MetricCompute< R > | undefined} - Pre-computed result or undefined if not applicable
     */
    protected preCompute ( a: string, b: string, m: number, n: number ) : MetricCompute< R > | undefined {
        // If strings are identical, return a similarity of 1
        if ( a === b ) return { res: 1 };

        // If the lengths of both strings is less than 2, return a similarity of 0
        if ( m == 0 || n == 0 || ( m < 2 && n < 2 ) ) return { res: 0 };

        return undefined;
    }

    /**
     * Abstract method to be implemented by subclasses to perform the metric computation.
     * This method should contain the logic for computing the metric between two strings.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @param {number} maxLen - Maximum length of the strings
     * @returns {MetricCompute< R >} - The result of the metric computation
     * @throws {Error} - If not overridden in a subclass
     */
    protected compute ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute< R > {
        void [ a, b, m, n, maxLen ];
        throw new Error ( `Method compute() must be overridden in a subclass` );
    }

    /**
     * Run the metric computation for single inputs (two strings).
     * Applies preCompute for trivial cases before cache lookup and computation.
     * 
     * If the profiler is active, it will measure time and memory usage.
     * 
     * @param {number} i - Pointer to the first string
     * @param {number} j - Pointer to the second string
     * @returns {MetricResultSingle< R >} - The result of the metric computation
     */
    private runSingle ( i: number, j: number ) : MetricResultSingle< R > {
        // Type safety: convert inputs to strings
        let a = String ( this.a[ i ] ), A = a;
        let b = String ( this.b[ j ] ), B = b;

        // Get lengths
        let m = A.length, n = B.length;

        // Pre-compute trivial cases (identical, empty, etc.)
        let result = this.preCompute( A, B, m, n );

        if ( ! result ) {
            // If the profiler is enabled, measure; else, just run
            result = profiler.run( () : MetricCompute< R > => {
                // If the metric is symmetrical, swap `a` and `b` (shorter string first)
                if ( this.symmetric ) [ A, B, m, n ] = Metric.swap( A, B, m, n );

                // Generate a cache key based on the metric and pair of strings `a` and `b`
                // Concatenate with options to ensure different options yield different cache entries
                const key = Metric.cache.key( this.metric, [ A, B ], this.symmetric ) + this.optKey;

                // If the key exists in the cache, return the cached result
                // Otherwise, compute the metric using the algorithm
                return Metric.cache.get( key || '' ) ?? ( () => {
                    // Compute the similarity using the algorithm
                    const res = this.compute( A, B, m, n, Math.max( m, n ) );

                    // If a key was generated, store the result in the cache
                    if ( key ) Metric.cache.set( key, res );

                    return res;
                } )();
            } );
        }

        // Build metric result object
        return {
            metric: this.metric,
            a: this.origA[ i ] ?? a,
            b: this.origB[ j ] ?? b,
            ...result
        };
    }

    /**
     * Run the metric computation for single inputs (two strings) asynchronously.
     * 
     * @param {number} i - Pointer to the first string
     * @param {number} j - Pointer to the second string
     * @returns {Promise< MetricResultSingle< R > >} - Promise resolving the result of the metric computation
     */
    private async runSingleAsync ( i: number, j: number ) : Promise< MetricResultSingle< R > > {
        return Promise.resolve( this.runSingle( i, j ) );
    }

    /**
     * Run the metric computation for batch inputs (arrays of strings).
     * 
     * It iterates through each string in the first array and computes the metric
     * against each string in the second array.
     */
    private runBatch () : void {
        const results: MetricResultBatch< R > = [];

        // Loop through each combination of strings in a[] and b[]
        for ( let i = 0; i < this.a.length; i++ )
            for ( let j = 0; j < this.b.length; j++ )
                results.push( this.runSingle( i, j ) );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = results;
    }

    /**
     * Run the metric computation for batch inputs (arrays of strings) asynchronously.
     */
    private async runBatchAsync () : Promise< void > {
        const results: MetricResultBatch< R > = [];

        // Loop through each combination of strings in a[] and b[]
        for ( let i = 0; i < this.a.length; i++ )
            for ( let j = 0; j < this.b.length; j++ )
                results.push( await this.runSingleAsync( i, j ) );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = results;
    }

    /**
     * Run the metric computation for pairwise inputs (A[i] vs B[i]).
     * 
     * This method assumes that both `a` and `b` are arrays of equal length
     * and computes the metric only for corresponding index pairs.
     */
    private runPairwise () : void {
        const results: MetricResultBatch< R > = [];

        // Compute metric for each corresponding pair
        for ( let i = 0; i < this.a.length; i++ ) results.push( this.runSingle( i, i ) );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = results;
    }

    /**
     * Run the metric computation for pairwise inputs (A[i] vs B[i]) asynchronously.
     */
    private async runPairwiseAsync () : Promise< void > {
        const results: MetricResultBatch< R > = [];

        // Compute metric for each corresponding pair
        for ( let i = 0; i < this.a.length; i++ )
            results.push( await this.runSingleAsync( i, i ) );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = results;
    }

    /**
     * Set the original inputs to which the results of the metric calculation will refer.
     * 
     * @param {MetricInput} [a] - original input(s) for a
     * @param {MetricInput} [b] - original input(s) for b
     */
    public setOriginal ( a?: MetricInput, b?: MetricInput ) : this {
        if ( a ) this.origA = Array.isArray( a ) ? a : [ a ];
        if ( b ) this.origB = Array.isArray( b ) ? b : [ b ];

        return this;
    }

    /**
     * Check if the inputs are in batch mode.
     * 
     * This method checks if either `a` or `b` contains more than one string,
     * indicating that the metric is being run in batch mode.
     * 
     * @returns {boolean} - True if either input is an array with more than one element
     */
    public isBatch = () : boolean => this.a.length > 1 || this.b.length > 1;

    /**
     * Check if the inputs are in single mode.
     * 
     * This method checks if both `a` and `b` are single strings (not arrays),
     * indicating that the metric is being run on a single pair of strings.
     * 
     * @returns {boolean} - True if both inputs are single strings
     */
    public isSingle = () : boolean => ! this.isBatch();

    /**
     * Check if the inputs are in pairwise mode.
     * 
     * This method checks if both `a` and `b` are arrays of the same length,
     * indicating that the metric is being run on corresponding pairs of strings.
     * 
     * @returns {boolean} - True if both inputs are arrays of equal length
     * @param {boolean} [safe=false] - If true, does not throw an error if lengths are not equal
     * @throws {Error} - If `safe` is false and the lengths of `a` and `b` are not equal
     */
    public isPairwise ( safe: boolean = false ) : boolean {
        return this.isBatch() && this.a.length === this.b.length ? true : ! safe && ( () => {
            throw new Error ( `Mode <pairwise> requires arrays of equal length` );
        } )();
    }

    /**
     * Check if the metric is symmetrical.
     * 
     * This method returns whether the metric is symmetric, meaning it produces the same
     * result regardless of the order of inputs (e.g., Levenshtein distance).
     * 
     * @returns {boolean} - True if the metric is symmetric
     */
    public isSymmetrical = () : boolean => this.symmetric;

    /**
     * Determine which mode to run the metric in.
     * 
     * This method checks the provided mode or defaults to the mode specified in options.
     * If no mode is specified, it defaults to 'default'.
     * 
     * @param {MetricMode} [mode] - The mode to run the metric in (optional)
     * @returns {MetricMode} - The determined mode
     */
    public whichMode = ( mode?: MetricMode ) : MetricMode => mode ?? this.options?.mode ?? 'default';

    /**
     * Clear the cached results of the metric.
     * 
     * This method resets the `results` property to `undefined`, effectively clearing
     * any previously computed results. It can be useful for re-running the metric
     * with new inputs or options.
     */
    public clear = () : void => this.results = undefined;

    /**
     * Run the metric computation based on the specified mode.
     * 
     * @param {MetricMode} [mode] - The mode to run the metric in (optional)
     * @param {boolean} [clear=true] - Whether to clear previous results before running
     * @throws {Error} - If an unsupported mode is specified
     */
    public run ( mode?: MetricMode, clear: boolean = true ) : void {
        // Clear previous results if requested
        if ( clear ) this.clear();

        switch ( this.whichMode( mode ) ) {
            // Default mode runs the metric on single inputs or falls back to batch mode
            case 'default': if ( this.isSingle() ) { this.results = this.runSingle( 0, 0 ); break; }
            // Batch mode runs the metric on all combinations of a[] and b[]
            case 'batch': this.runBatch(); break;
            // Single mode runs the metric on the first elements of a[] and b[]
            case 'single': this.results = this.runSingle( 0, 0 ); break;
            // Pairwise mode runs the metric on corresponding pairs of a[] and b[]
            case 'pairwise': if ( this.isPairwise() ) this.runPairwise(); break;
            // Unsupported mode
            default: throw new Error ( `Unsupported mode <${mode}>` );
        }
    }

    /**
     * Run the metric computation based on the specified mode asynchronously.
     * 
     * @param {MetricMode} [mode] - The mode to run the metric in (optional)
     * @param {boolean} [clear=true] - Whether to clear previous results before running
     * @returns {Promise<void>} - A promise that resolves when the metric computation is complete
     * @throws {Error} - If an unsupported mode is specified
     */
    public async runAsync ( mode?: MetricMode, clear: boolean = true ) : Promise<void> {
        // Clear previous results if requested
        if ( clear ) this.clear();

        switch ( this.whichMode( mode ) ) {
            // Default mode runs the metric on single inputs or falls back to batch mode
            case 'default': if ( this.isSingle() ) { this.results = await this.runSingleAsync( 0, 0 ); break; }
            // Batch mode runs the metric on all combinations of a[] and b[]
            case 'batch': await this.runBatchAsync(); break;
            // Single mode runs the metric on the first elements of a[] and b[]
            case 'single': this.results = await this.runSingleAsync( 0, 0 ); break;
            // Pairwise mode runs the metric on corresponding pairs of a[] and b[]
            case 'pairwise': if ( this.isPairwise() ) await this.runPairwiseAsync(); break;
            // Unsupported mode
            default: throw new Error ( `Unsupported async mode <${mode}>` );
        }
    }

    /**
     * Get the name of the metric.
     * 
     * @returns {string} - The name of the metric
     */
    public getMetricName = () : string => this.metric;

    /**
     * Get the result of the metric computation.
     * 
     * @returns {MetricResult< R >} - The result of the metric computation
     * @throws {Error} - If `run()` has not been called before this method
     */
    public getResults () : MetricResult< R > {
        // Ensure that the metric has been run before getting the result
        if ( this.results === undefined ) throw new Error ( `run() must be called before getResult()` );

        // Return the result(s)
        return this.results;
    }

}

/**
 * Metric registry service for managing metric implementations.
 * 
 * This registry allows for dynamic registration and retrieval of metric classes,
 * enabling the use of various string similarity metrics in a consistent manner.
 */
export const MetricRegistry: RegistryService< Metric< MetricRaw > > = Registry( 'metric', Metric );

/**
 * Type definition for a class constructor that extends the Metric class.
 * 
 * This type represents a constructor function for a class that extends the Metric
 * class. It can be used to create instances of specific metric implementations,
 * such as Levenshtein or Jaro-Winkler.
 * 
 * @template R - The type of the raw result, defaulting to `MetricRaw`.
 */
export type MetricCls< R = MetricRaw > = new ( ...args: any[] ) => Metric< R >;
