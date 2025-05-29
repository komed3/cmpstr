/**
 * Abstract Metric
 * src/metrics/Metric.ts
 * 
 * The Metric class serves as an abstract base class for implementing various string
 * metrics. It provides a structure for computing metrics between two strings or
 * arrays of strings, allowing for both single and batch processing. If a and b are
 * arrays of the same length, pairwise similarity check is possible.
 * 
 * This class is designed to be extended by specific metric implementations, such as
 * the Levenshtein distance.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricMode, MetricCompute, MetricResult, MetricResultSingle } from '../utils/Types';
import { Helper } from '../utils/Helper';
import { Perf } from '../utils/Performance';

/**
 * Abstract class representing a generic string metric.
 * 
 * @abstract
 */
export abstract class Metric {

    // Metric name for identification
    private readonly metric: string;

    // Inputs for the metric computation, transformed into arrays
    private readonly a: string[];
    private readonly b: string[];

    // Options for the metric computation, such as performance tracking
    protected readonly options: MetricOptions;

    // Optional performance tracker
    private readonly perf: Perf | undefined;

    // Result of the metric computation, which can be a single result or an array of results
    // This will be populated after running the metric
    private res: MetricResult | undefined;

    /**
     * Constructor for the Metric class.
     * 
     * Initializes the metric with two inputs (strings or arrays of strings) and options.
     * 
     * @constructor
     * @param {string} metric - The name of the metric (e.g., 'levenshtein')
     * @param {MetricInput} a - First input string or array of strings
     * @param {MetricInput} b - Second input string or array of strings
     * @param {MetricOptions} options - Options for the metric computation
     */
    constructor (
        metric: string,
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        // Set the metric name
        this.metric = metric;

        // Set the inputs and options
        this.a = Helper.asArr( a );
        this.b = Helper.asArr( b );
        this.options = options;

        // Optionally start performance measurement
        this.perf = this.options.perf ? Perf.getInstance() : undefined;

    }

    /**
     * Calculates the normalized similarity based on the raw and maximum value.
     * 
     * @protected
     * @param {number} raw - Raw value (e.g., distance)
     * @param {number} max - Maximum value (e.g., maximum possible distance)
     * @returns {number} - Normalized similarity (0 to 1)
     */
    protected normalized ( raw: number, max: number ) : number {

        return max === 0 ? 1 : 1 - raw / max;

    }

    /**
     * Abstract method to be implemented by subclasses to perform the metric computation.
     * 
     * This method should contain the logic for computing the metric between two strings.
     * 
     * @protected
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
     * 
     * It computes the Levenshtein distance between the two strings and returns
     * the result in a structured format.
     * 
     * @private
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {MetricResultSingle} - The result of the metric computation
     */
    private runSingle ( a: string, b: string ) : MetricResultSingle {

        // Type safety: convert inputs to strings
        a = String ( a ), b = String ( b );

        // Get length of string a, b and their max length
        const m: number = a.length, n: number = b.length;
        const maxLen: number = Math.max( m, n );

        // Compute the similarity using the algorithm
        const { res, raw = {} } = this.algo( a, b, m, n, maxLen );

        // Build result object, optionally including performance data
        return {
            metric: this.metric, a, b, res, raw,
            ...( this.perf ? { perf: this.perf.measure() } : {} )
        };

    }

    /**
     * Run the metric computation for batch inputs (arrays of strings).
     * 
     * It iterates through each string in the first array and computes the metric
     * against each string in the second array, storing the results in `this.res`.
     * 
     * @private
     */
    private runBatch () : void {

        const results: MetricResultSingle[] = [];

        // Loop through each combination of strings in a[] and b[]
        for ( const a of this.a ) { for ( const b of this.b ) {

            results.push( this.runSingle( a, b ) );

        } }

        // Populate the results
        // `this.res` will be an array of MetricResultSingle
        this.res = results;

    }

    /**
     * Run the metric computation for pairwise inputs (A[i] vs B[i]).
     * 
     * This method assumes that both `a` and `b` are arrays of equal length
     * and computes the metric only for corresponding index pairs.
     * 
     * @private
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
        // `this.res` will be an array of MetricResultSingle
        this.res = results;

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
        this.res = undefined;

        // Which mode to run the metric in
        // Default to 'default' if not specified
        mode = mode ?? this.options?.mode ?? 'default';

        switch ( mode ) {

            // Default mode runs the metric on single inputs or batch
            case 'default':
                this.isSingle() ? ( this.res = this.runSingle(
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
        if ( this.res === undefined ) {

            throw new Error ( `run() must be called before getResult()` );

        }

        // Return the result(s)
        return this.res;

    }

}