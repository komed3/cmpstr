/**
 * Abstract Metric
 * src/metrics/Metric.ts
 * 
 * This module defines an abstract class for string metrics, providing a framework for
 * computing various string similarity metrics. It includes methods for running metrics
 * in different modes (single, batch, pairwise) and caching results to optimize
 * performance. The class is designed to be extended by specific metric implementations
 * like the Levenshtein distance or Jaro-Winkler similarity.
 * 
 * It provides:
 *  - A base class for string metrics with common functionality
 *  - Methods for running metrics in different modes
 *  - Caching of metric computations to avoid redundant calculations
 *  - Performance tracking capabilities
 * 
 * This class is intended to be extended by specific metric implementations that will
 * implement the `algo` method to define the specific metric computation logic.
 * 
 * @module Metric
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricMode, MetricInput, MetricOptions, MetricCompute, MetricResult, MetricResultSingle } from '../utils/Types';
import { HashTable } from '../utils/HashTable';
import { Perf } from '../utils/Performance';

/**
 * Abstract class representing a generic string metric.
 * 
 * @abstract
 */
export abstract class Metric {

    // Cache for metric computations to avoid redundant calculations
    private static cache: HashTable<string, MetricCompute> = new HashTable ();

    // Metric name for identification
    private readonly metric: string;

    // Inputs for the metric computation, transformed into arrays
    private readonly a: string[];
    private readonly b: string[];

    // Options for the metric computation, such as performance tracking
    protected readonly options: MetricOptions;

    // Optional performance tracker
    private readonly perf: Perf | undefined;

    /**
     * Result of the metric computation, which can be a single result or an array of results.
     * This will be populated after running the metric.
     */
    private results: MetricResult | undefined;

    /**
     * Swaps two strings and their lengths if the first is longer than the second.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @param {number} m - Length of the first string
     * @param {number} n - Length of the second string
     * @returns {[string, string, number, number]} - Swapped strings and lengths
     */
    public static swap ( a: string, b: string, m: number, n: number ) : [
        string, string, number, number
    ] {

        return m > n ? [ b, a, n, m ] : [ a, b, m, n ];

    }

    /**
     * Calculates the normalized similarity based on the raw and maximum value.
     * 
     * @param {number} raw - Raw value (e.g., distance)
     * @param {number} max - Maximum value (e.g., maximum possible distance)
     * @returns {number} - Normalized similarity (0 to 1)
     */
    public static norm ( raw: number, max: number ) : number {

        return max === 0 ? 1 : 1 - raw / max;

    }

    /**
     * Constructor for the Metric class.
     * Initializes the metric with two inputs (strings or arrays of strings) and options.
     * 
     * @param {string} metric - The name of the metric (e.g., 'levenshtein')
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     * @throws {Error} - If inputs `a` or `b` are empty
     */
    constructor (
        metric: string,
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        // Set the metric name
        this.metric = metric;

        // Set the inputs and options
        this.a = Array.isArray( a ) ? a : [ a ];
        this.b = Array.isArray( b ) ? b : [ b ];
        this.options = options;

        // Validate inputs: ensure they are not empty
        if ( this.a.length === 0 || this.b.length === 0 ) {

            throw new Error( `inputs a and b must not be empty` );

        }

        // Optionally start performance measurement
        this.perf = this.options.perf ? Perf.getInstance( true ) : undefined;

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
     * @returns {MetricCompute} - The result of the metric computation
     * @throws {Error} - If not overridden in a subclass
     */
    protected algo ( a: string, b: string, m: number, n: number, maxLen: number ) : MetricCompute {

        throw new Error ( `method algo() must be overridden in a subclass` );

    }

    /**
     * Run the metric computation for single inputs (two strings).
     * It uses a cache to avoid redundant calculations.
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {MetricResultSingle} - The result of the metric computation
     */
    private runSingle ( a: string, b: string ) : MetricResultSingle {

        // Type safety: convert inputs to strings
        a = String ( a ), b = String ( b );

        // Generate a cache key based on the metric and pair of strings `a` and `b`
        const key: string | false = Metric.cache.key( this.metric, a, b );

        // If the key exists in the cache, return the cached result
        // Otherwise, compute the metric using the algorithm
        const result: MetricCompute = ( key && Metric.cache.has( key ) ) ? Metric.cache.get( key )! : ( () => {

            // Get length of string a, b
            const m: number = a.length, n: number = b.length;

            // Compute the similarity using the algorithm
            const res: MetricCompute = this.algo( a, b, m, n, Math.max( m, n ) );

            // If a key was generated, store the result in the cache
            if ( key ) Metric.cache.set( key, res );

            return res;

        } )();

        // Build result object, optionally including performance data
        return { metric: this.metric, a, b, ...result, ...(
            this.perf ? { perf: this.perf.measure() } : {} 
        ) };

    }

    /**
     * Run the metric computation for batch inputs (arrays of strings).
     * 
     * It iterates through each string in the first array and computes the metric
     * against each string in the second array, storing the results in `this.res`.
     */
    private runBatch () : void {

        const results: MetricResultSingle[] = [];

        // Loop through each combination of strings in a[] and b[]
        for ( const a of this.a ) { for ( const b of this.b ) {

            results.push( this.runSingle( a, b ) );

        } }

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = results;

    }

    /**
     * Run the metric computation for pairwise inputs (A[i] vs B[i]).
     * 
     * This method assumes that both `a` and `b` are arrays of equal length
     * and computes the metric only for corresponding index pairs.
     * 
     * @throws {Error} - If inputs are not arrays or their lengths differ
     */
    private runPairs () : void {

        // Check if inputs are suitable for pairwise comparison
        if ( ! this.isPairwise() ) {

            throw new Error ( `mode <pairwise> requires arrays of equal length` );

        }

        const results: MetricResultSingle[] = [];

        // Compute metric for each corresponding pair
        for ( let i = 0; i < this.a.length; i++ ) {

            results.push( this.runSingle( this.a[ i ], this.b[ i ] ) );

        }

        // Populate the results
        // `this.results` will be an array of MetricResultSingle
        this.results = results;

    }

    /**
     * Check if the inputs are in batch mode.
     * 
     * This method checks if either `a` or `b` contains more than one string,
     * indicating that the metric is being run in batch mode.
     * 
     * @returns {boolean} - True if either input is an array with more than one element
     */
    public isBatch () : boolean {

        return this.a.length > 1 || this.b.length > 1;

    }

    /**
     * Check if the inputs are in single mode.
     * 
     * This method checks if both `a` and `b` are single strings (not arrays),
     * indicating that the metric is being run on a single pair of strings.
     * 
     * @returns {boolean} - True if both inputs are single strings
     */
    public isSingle () : boolean {

        return ! this.isBatch();

    }

    /**
     * Check if the inputs are in pairwise mode.
     * 
     * This method checks if both `a` and `b` are arrays of the same length,
     * indicating that the metric is being run on corresponding pairs of strings.
     * 
     * @returns {boolean} - True if both inputs are arrays of equal length
     */
    public isPairwise () : boolean {

        return this.isBatch() && this.a.length === this.b.length;

    }

    /**
     * Run the metric computation based on the specified mode.
     * 
     * This method determines which mode to run the metric in (default, batch, or pairwise)
     * and executes the corresponding logic. It populates `this.res` with the results.
     * 
     * @param {MetricMode} mode - The mode to run the metric in
     * @throws {Error} - If an unsupported mode is specified
     */
    public run ( mode: MetricMode ) : void {

        // Reset the result before running the metric
        // This ensures that previous results do not persist
        this.results = undefined;

        // Which mode to run the metric in
        // Default to 'default' if not specified
        mode = mode ?? this.options?.mode ?? 'default';

        switch ( mode ) {

            // Default mode runs the metric on single inputs or batch
            case 'default':
                this.isSingle() ? ( this.results = this.runSingle(
                    this.a[ 0 ], this.b[ 0 ]
                ) ) : this.runBatch();
                break;

            // Batch mode runs the metric on all combinations of a[] and b[]
            case 'batch':
                this.runBatch();
                break;

            // Pairwise mode runs the metric on corresponding pairs of a[] and b[]
            case 'pairwise':
                this.runPairs();
                break;

            // Unsupported mode
            // This will throw an error if an unsupported mode is specified
            default:
                throw new Error ( `unsupported mode <${mode}>` );

        }

    }

    /**
     * Get the name of the metric.
     * 
     * @returns {string} - The name of the metric
     */
    public getMetricName () : string {

        return this.metric;

    }

    /**
     * Get the result of the metric computation.
     * 
     * @returns {MetricResult} - The result of the metric computation
     * @throws {Error} - If `run()` has not been called before this method
     */
    public getResults () : MetricResult {

        // Ensure that the metric has been run before getting the result
        if ( this.results === undefined ) {

            throw new Error ( `run() must be called before getResult()` );

        }

        // Return the result(s)
        return this.results;

    }

}