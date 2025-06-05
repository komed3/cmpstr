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
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    MetricMode, MetricInput, MetricOptions, MetricCompute, MetricRaw, MetricResult,
    MetricResultSingle, MetricResultBatch, RegistryService
} from '../utils/Types';

import { Registry } from '../utils/Registry';
import { HashTable } from '../utils/HashTable';
import { Profiler } from '../utils/Profiler';

// Get the singleton profiler instance for performance monitoring
const profiler = Profiler.getInstance();

/**
 * Abstract class representing a generic string metric.
 * 
 * @abstract
 * @template R - The type of the raw result, defaulting to `MetricRaw`.
 */
export abstract class Metric<R = MetricRaw> {

    // Cache for metric computations to avoid redundant calculations
    private static cache: HashTable<string, MetricCompute<any>> = new HashTable ();

    // Metric name for identification
    private readonly metric: string;

    // Inputs for the metric computation, transformed into arrays
    private readonly a: string[];
    private readonly b: string[];

    // Options for the metric computation, such as performance tracking
    protected readonly options: MetricOptions;

    // Indicates whether the metric is symmetric (same result for inputs in any order)
    protected readonly symmetric: boolean;

    /**
     * Result of the metric computation, which can be a single result or an array of results.
     * This will be populated after running the metric.
     */
    private results: MetricResult<R> | undefined;

    /**
     * Static method to clear the cache of metric computations.
     */
    public static clear () : void { this.cache.clear() }

    /**
     * Swaps two strings and their lengths if the first is longer than the second.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @returns {[string, string, number, number]} - Swapped strings and lengths
     */
    protected static swap ( a: string, b: string, m: number, n: number ) : [
        string, string, number, number
    ] { return m > n ? [ b, a, n, m ] : [ a, b, m, n ] }

    /**
     * Clamps the similarity result between 0 and 1.
     * 
     * @param {number} res - The input similarity to clamp
     * @returns {number} - The clamped similarity (0 to 1)
     */
    protected static clamp ( res: number ) : number { return Math.max( 0, Math.min( 1, res ) ) }

    /**
     * Constructor for the Metric class.
     * Initializes the metric with two inputs (strings or arrays of strings) and options.
     * 
     * @param {string} metric - The name of the metric (e.g. 'levenshtein')
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     * @throws {Error} - If inputs `a` or `b` are empty
     */
    constructor (
        metric: string,
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {},
        symmetric: boolean = false
    ) {

        // Set the metric name
        this.metric = metric;

        // Set the inputs
        this.a = Array.isArray( a ) ? a : [ a ];
        this.b = Array.isArray( b ) ? b : [ b ];

        // Validate inputs: ensure they are not empty
        if ( this.a.length === 0 || this.b.length === 0 ) throw new Error(
            `inputs <a> and <b> must not be empty`
        );

        // Set options
        this.options = options;
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
     * @returns {MetricCompute<R> | undefined} - Pre-computed result or undefined if not applicable
     */
    protected preCompute ( a: string, b: string, m: number, n: number ) : MetricCompute<R> | undefined {

        // If strings are identical, return a similarity of 1
        if ( a === b ) return { res: 1 };

        // If the lengths of both strings is less than 2, return a similarity of 0
        else if ( m == 0 || n == 0 || ( m < 2 && n < 2 ) ) return { res: 0 };

        else undefined;

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
     * @returns {MetricCompute<R>} - The result of the metric computation
     * @throws {Error} - If not overridden in a subclass
     */
    protected compute ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute<R> {

        void [ a, b, m, n, maxLen ];

        throw new Error ( `method compute() must be overridden in a subclass` );

    }

    /**
     * Post-process the results of the metric computation.
     * This method can be overridden by subclasses to modify the results after computation.
     * 
     * @param {MetricResultBatch<R>} res - The batch of results to post-process
     * @returns {MetricResultBatch<R>} - The post-processed results
     */
    protected postProcess ( res: MetricResultBatch<R> ) : MetricResultBatch<R> {

        const { removeZero = false } = this.options;

        return res.filter( r => ! removeZero || r.res > 0 );

    }

    /**
     * Run the metric computation for single inputs (two strings).
     * Applies preCompute for trivial cases before cache lookup and computation.
     * 
     * If the profiler is active, it will measure time and memory usage.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {MetricResultSingle<R>} - The result of the metric computation
     */
    private runSingle ( a: string, b: string ) : MetricResultSingle<R> {

        // Type safety: convert inputs to strings
        let A = a = String ( a ), B = b = String ( b );

        // Get lengths
        let m: number = A.length, n: number = B.length;

        // Pre-compute trivial cases (identical, empty, etc.)
        let result: MetricCompute<R> | undefined = this.preCompute( A, B, m, n );

        if ( ! result ) {

            // If the profiler is enabled, measure; else, just run
            result = profiler.run( () : MetricCompute<R> => {

                // Generate a cache key based on the metric and pair of strings `a` and `b`
                const key: string | false = Metric.cache.key( this.metric, [ A, B ], this.symmetric );

                // If the key exists in the cache, return the cached result
                // Otherwise, compute the metric using the algorithm
                return Metric.cache.get( key || '' ) ?? ( () => {

                    // If the metric is symmetrical, swap `a` and `b` (shorter string first)
                    if ( this.symmetric ) [ A, B, m, n ] = Metric.swap( A, B, m, n );

                    // Compute the similarity using the algorithm
                    const res = this.compute( A, B, m, n, Math.max( m, n ) );

                    // If a key was generated, store the result in the cache
                    if ( key ) Metric.cache.set( key, res );

                    return res;

                } )();

            } );

        }

        // Build metric result object
        return { metric: this.metric, a, b, ...result };

    }

    /**
     * Run the metric computation for single inputs (two strings) asynchronously.
     * 
     * This method is similar to `runSingle`, but it returns a Promise that resolves
     * with the result of the metric computation.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {Promise<MetricResultSingle<R>>} - Promise resolving the result of the metric computation
     */
    private async runSingleAsync ( a: string, b: string ) : Promise<MetricResultSingle<R>> {

        return Promise.resolve( this.runSingle( a, b ) );

    }

    /**
     * Run the metric computation for batch inputs (arrays of strings).
     * 
     * It iterates through each string in the first array and computes the metric
     * against each string in the second array.
     */
    private runBatch () : void {

        const results: MetricResultBatch<R> = [];

        // Loop through each combination of strings in a[] and b[]
        for ( const a of this.a ) for ( const b of this.b ) results.push(
            this.runSingle( a, b )
        );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = this.postProcess( results );

    }

    /**
     * Run the metric computation for batch inputs (arrays of strings) asynchronously.
     * 
     * This method is similar to `runBatch`, but it returns a Promise that resolves
     * when all computations are complete, allowing for asynchronous execution.
     */
    private async runBatchAsync () : Promise<void> {

        const results: MetricResultBatch<R> = [];

        // Loop through each combination of strings in a[] and b[]
        for ( const a of this.a ) for ( const b of this.b ) results.push(
            await this.runSingleAsync( a, b )
        );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = this.postProcess( results );

    }

    /**
     * Run the metric computation for pairwise inputs (A[i] vs B[i]).
     * 
     * This method assumes that both `a` and `b` are arrays of equal length
     * and computes the metric only for corresponding index pairs.
     */
    private runPairwise () : void {

        const results: MetricResultBatch<R> = [];

        // Compute metric for each corresponding pair
        for ( let i = 0; i < this.a.length; i++ ) results.push(
            this.runSingle( this.a[ i ], this.b[ i ] )
        );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = this.postProcess( results );

    }

    /**
     * Run the metric computation for pairwise inputs (A[i] vs B[i]) asynchronously.
     * 
     * This method is similar to `runPairwise`, but it returns a Promise that resolves
     * when all computations are complete, allowing for asynchronous execution.
     */
    private async runPairwiseAsync () : Promise<void> {

        const results: MetricResultBatch<R> = [];

        // Compute metric for each corresponding pair
        for ( let i = 0; i < this.a.length; i++ ) results.push(
            await this.runSingleAsync( this.a[ i ], this.b[ i ] )
        );

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = this.postProcess( results );

    }

    /**
     * Check if the inputs are in batch mode.
     * 
     * This method checks if either `a` or `b` contains more than one string,
     * indicating that the metric is being run in batch mode.
     * 
     * @returns {boolean} - True if either input is an array with more than one element
     */
    public isBatch () : boolean { return this.a.length > 1 || this.b.length > 1 }

    /**
     * Check if the inputs are in single mode.
     * 
     * This method checks if both `a` and `b` are single strings (not arrays),
     * indicating that the metric is being run on a single pair of strings.
     * 
     * @returns {boolean} - True if both inputs are single strings
     */
    public isSingle () : boolean { return ! this.isBatch() }

    /**
     * Check if the inputs are in pairwise mode.
     * 
     * This method checks if both `a` and `b` are arrays of the same length,
     * indicating that the metric is being run on corresponding pairs of strings.
     * 
     * @returns {boolean} - True if both inputs are arrays of equal length
     * @param {boolean} safe - If true, does not throw an error if lengths are not equal
     * @throws {Error} - If `safe` is false and the lengths of `a` and `b` are not equal
     */
    public isPairwise ( safe: boolean = false ) : boolean {

        return this.isBatch() && this.a.length === this.b.length ? true : ! safe && ( () => {
            throw new Error ( `mode <pairwise> requires arrays of equal length` );
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
    public isSymmetrical () : boolean { return this.symmetric }

    /**
     * Determine which mode to run the metric in.
     * 
     * This method checks the provided mode or defaults to the mode specified in options.
     * If no mode is specified, it defaults to 'default'.
     * 
     * @param {MetricMode} [mode] - The mode to run the metric in (optional)
     * @returns {MetricMode} - The determined mode
     */
    public whichMode ( mode?: MetricMode ) : MetricMode { return mode ?? this.options?.mode ?? 'default' }

    /**
     * Clear the cached results of the metric.
     * 
     * This method resets the `results` property to `undefined`, effectively clearing
     * any previously computed results. It can be useful for re-running the metric
     * with new inputs or options.
     */
    public clear () : void { this.results = undefined }

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
            case 'default': if ( this.isSingle() ) {
                this.results = this.runSingle( this.a[ 0 ], this.b[ 0 ] );
                break;
            }

            // Batch mode runs the metric on all combinations of a[] and b[]
            case 'batch': this.runBatch(); break;

            // Single mode runs the metric on the first elements of a[] and b[]
            case 'single': this.results = this.runSingle( this.a[ 0 ], this.b[ 0 ] ); break;

            // Pairwise mode runs the metric on corresponding pairs of a[] and b[]
            case 'pairwise': if ( this.isPairwise() ) this.runPairwise(); break;

            // Unsupported mode
            default: throw new Error ( `unsupported mode <${mode}>` );

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
            case 'default': if ( this.isSingle() ) {
                this.results = await this.runSingleAsync( this.a[ 0 ], this.b[ 0 ] );
                break;
            }

            // Batch mode runs the metric on all combinations of a[] and b[]
            case 'batch': await this.runBatchAsync(); break;

            // Single mode runs the metric on the first elements of a[] and b[]
            case 'single': this.results = await this.runSingleAsync( this.a[ 0 ], this.b[ 0 ] ); break;

            // Pairwise mode runs the metric on corresponding pairs of a[] and b[]
            case 'pairwise': if ( this.isPairwise() ) await this.runPairwiseAsync(); break;

            // Unsupported mode
            default: throw new Error ( `unsupported async mode <${mode}>` );

        }

    }

    /**
     * Get the name of the metric.
     * 
     * @returns {string} - The name of the metric
     */
    public getMetricName () : string { return this.metric }

    /**
     * Get the result of the metric computation.
     * 
     * @returns {MetricResult<R>} - The result of the metric computation
     * @throws {Error} - If `run()` has not been called before this method
     */
    public getResults () : MetricResult<R> {

        // Ensure that the metric has been run before getting the result
        if ( this.results === undefined ) throw new Error (
            `run() must be called before getResult()`
        );

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
export const MetricRegistry: RegistryService<Metric<MetricRaw>> = Registry( Metric );

/**
 * Type definition for a class constructor that extends the Metric class.
 * 
 * This type represents a constructor function for a class that extends the Metric
 * class. It can be used to create instances of specific metric implementations,
 * such as Levenshtein or Jaro-Winkler.
 * 
 * @template R - The type of the raw result, defaulting to `MetricRaw`.
 */
export type MetricCls<R = MetricRaw> = new ( ...args: any[] ) => Metric<R>;