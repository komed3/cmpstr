/**
 * Abstract Metric
 * src/metrics/Metric.ts
 * 
 * The Metric class serves as an abstract base class for implementing various string
 * metrics. It provides a structure for computing metrics between two strings or
 * arrays of strings, allowing for both single and batch processing. This class is
 * designed to be extended by specific metric implementations, such as the Levenshtein
 * distance.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { MetricInput, MetricOptions, MetricCompute, MetricResult, MetricResultSingle } from '../utils/Types';
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

    // Inputs for the metric computation, which can be either strings or arrays of strings
    private readonly a: MetricInput;
    private readonly b: MetricInput;

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
        this.a = a, this.b = b;
        this.options = options;

        // Optionally start performance measurement
        this.perf = this.options.perf ? new Perf () : undefined;

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

        // Get length of string a, b and their max length
        const m: number = a.length, n: number = b.length;
        const maxLen: number = Math.max( m, n );

        // Compute the similarity using the algorithm
        const { res, raw = {} } = this.algo( a, b, m, n, maxLen );

        // Build result object, optionally including performance data
        return {
            metric: this.metric, a, b, res, raw,
            ...( this.perf ? { perf: this.perf.get() } : {} )
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

        // Batch processing: compare all combinations of a[] and b[]
        const A: string[] = Helper.asArr( this.a );
        const B: string[] = Helper.asArr( this.b );

        for ( let i = 0; i < A.length; i++ ) {

            const s: string = A[ i ];

            for ( let j = 0; j < B.length; j++ ) {

                ( this.res as MetricResultSingle[] ).push(
                    this.runSingle( s, B[ j ] )
                );

            }

        }

    }

    /**
     * Check if the inputs are single strings.
     * 
     * @returns {boolean} - True if both inputs are strings, false otherwise
     */
    public isSingle () : boolean {

        return typeof this.a === 'string' && typeof this.b === 'string';

    }

    /**
     * Check if the inputs are batch (arrays of strings).
     * 
     * @returns {boolean} - True if either input is an array, false otherwise
     */
    public isBatch () : boolean {

        return Array.isArray( this.a ) || Array.isArray( this.b );

    }

    /**
     * Run the metric computation based on the input type (single or batch).
     * 
     * If the inputs are single strings, it computes the metric for those two strings.
     * If the inputs are arrays, it computes the metric for each pair of strings in the arrays.
     */
    public run () : void {

        // Perform a single computation if both inputs are strings
        if ( this.isSingle() ) {

            this.res = this.runSingle(
                this.a as string,
                this.b as string
            );

        }

        // Perform a batch computation if either input is an array
        else if ( this.isBatch() ) {

            this.runBatch();

        }

    }

    /**
     * Get the result of the metric computation.
     * 
     * @returns {MetricResult} - The result of the metric computation
     */
    public getResult () : MetricResult {

        if ( this.res === undefined ) {

            throw new Error ( `run() must be called before getResult()` );

        }

        return this.res;

    }

}