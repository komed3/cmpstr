/**
 * CmpStrAsync Asynchronous API
 * src/CmpStrAsync.ts
 * 
 * The CmpStrAsync class provides a fully asynchronous, Promise-based interface for
 * advanced string comparison, similarity measurement, phonetic indexing, filtering
 * and normalization. It extends the CmpStr class and overrides all relevant methods
 * to support non-blocking, scalable, and I/O-friendly workloads.
 * 
 * Features:
 *  - Asynchronous normalization, filtering, and metric computation
 *  - Async batch, pairwise, and single string comparison with detailed results
 *  - Async phonetic indexing and phonetic-aware search and comparison
 *  - Full compatibility with the synchronous CmpStr API
 *  - Designed for large-scale, high-performance, and server-side applications
 *
 * @module CmpStrAsync
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    CmpStrOptions, CmpStrProcessors, CmpStrResult, NormalizeFlags, PhoneticOptions,
    MetricRaw, MetricInput, MetricMode, MetricResult, MetricResultSingle, MetricResultBatch
} from './utils/Types';

import { CmpStr } from './CmpStr';
import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';

import { factory } from './utils/Registry';
import { Metric } from './metric';
import { Phonetic } from './phonetic';

/**
 * The CmpStrAsync class provides a fully asynchronous API for string comparison,
 * phonetic indexing, filtering and normalization.
 *
 * @template R - The type of the metric result, defaults to MetricRaw
 */
export class CmpStrAsync<R = MetricRaw> extends CmpStr<R> {

    /**
     * --------------------------------------------------------------------------------
     * Instanciate the CmpStrAsync class
     * --------------------------------------------------------------------------------
     * 
     * Methods to create a new CmpStrAsync instance with the given options.
     * Using the static `create` method is recommended to ensure proper instantiation.
     */

    /**
     * Creates a new CmpStrAsync instance with the given options.
     * 
     * @param {string|CmpStrOptions} [opt] - Optional serialized or options object
     * @returns {CmpStrAsync<R>} - A new CmpStrAsync instance
     */
    public static override create<R = MetricRaw> ( opt?: string | CmpStrOptions ) : CmpStrAsync<R> {

        return new CmpStrAsync ( opt );

    }

    /**
     * Creates a new CmpStrAsync instance calliing the super constructor.
     * 
     * @param {string | CmpStrOptions} [opt] - Optional serialized or options object
     */
    protected constructor ( opt?: string | CmpStrOptions ) { super ( opt ) }

    /**
     * ---------------------------------------------------------------------------------
     * Protected asynchronously utility methods for internal use
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide asynchronous normalization, filtering, and metric
     * computation capabilities, allowing for non-blocking operations.
     */

    /**
     * Asynchronously normalizes the input string or array using the configured or provided flags.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @returns {Promise<MetricInput>} - The normalized input
     */
    protected async normalizeAsync ( input: MetricInput, flags?: NormalizeFlags ) : Promise<MetricInput> {

        return Normalizer.normalizeAsync( input, flags ?? this.options.flags ?? '' );

    }

    /**
     * Asynchronously applies all active filters to the input string or array.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {string} [hook='input'] - The filter hook
     * @returns {Promise<MetricInput>} - The filtered string(s)
     */
    protected async filterAsync ( input: MetricInput, hook: string ) : Promise<MetricInput> {

        return Filter.applyAsync( hook, input as string );

    }

    /**
     * Asynchronously prepares the input by normalizing and filtering.
     * 
     * @param {MetricInput} [input] - The input string or array
     * @param {CmpStrOptions} [opt] - Optional options to use
     * @returns {Promise<MetricInput>} - The prepared input
     */
    protected async prepareAsync ( input: MetricInput, opt?: CmpStrOptions ) : Promise<MetricInput> {

        const { flags, processors } = opt ?? this.options;

        // Normalize the input using flags (i.e., 'itw')
        if ( flags?.length ) input = await this.normalizeAsync( input, flags );

        // Filter the input using hooked up filters
        input = await this.filterAsync( input, 'input' );

        // Apply phonetic processors if configured
        if ( processors?.phonetic ) input = await this.indexAsync( input, processors.phonetic );

        return input;

    }

    /**
     * Asynchronously computes the phonetic index for the given input using
     * the specified phonetic algorithm.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {{ algo: string, opt?: PhoneticOptions }} options - The phonetic algorithm and options
     * @returns {Promise<MetricInput>} - The phonetic index for the given input
     */
    protected async indexAsync ( input: MetricInput, { algo, opt }: {
        algo: string, opt?: PhoneticOptions
    } ) : Promise<MetricInput> {

        this.assert( 'phonetic', algo );

        const phonetic: Phonetic = factory.phonetic( algo, opt );
        const delimiter = opt?.delimiter ?? ' ';

        return Array.isArray( input )
            ? Promise.all( input.map( s => phonetic.getIndexAsync( s ).then( r => r.join( delimiter ) ) ) )
            : phonetic.getIndexAsync( input ).then( r => r.join( delimiter ) );

    }

    /**
     * Asynchronously computes the metric result for the given inputs, applying
     * normalization and filtering as configured.
     * 
     * @param {MetricInput} a - The first input string or array
     * @param {MetricInput} b - The second input string or array
     * @param {CmpStrOptions} [opt] - Optional options to use
     * @param {MetricMode} [mode='single'] - The metric mode to use
     * @param {boolean} [raw=false] - Whether to return raw results
     * @param {boolean} [skip=false] - Whether to skip normalization and filtering
     * @returns {Promise<T>} - The computed metric result
     */
    protected async computeAsync<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions,
        mode?: MetricMode, raw?: boolean, skip?: boolean
    ) : Promise<T> {

        const resolved: CmpStrOptions = this.resolveOptions( opt );

        this.assert( 'metric', resolved.metric );

        // Prepare the input
        const A: MetricInput = skip ? a : await this.prepareAsync( a, resolved );
        const B: MetricInput = skip ? b : await this.prepareAsync( b, resolved );

        // Get the metric class
        const metric: Metric<R> = factory.metric( resolved.metric!, A, B, resolved.opt );

        // Pass the original inputs to the metric
        metric.setOriginal( a, b );

        // Compute the metric result
        await metric.runAsync( mode );

        // Post-process the results and concat the original inputs
        const result = this.postProcess( metric.getResults(), resolved );

        // Resolve and return the result based on the raw flag
        return this.output<T>( result, raw ?? resolved.raw );

    }

    /**
     * ---------------------------------------------------------------------------------
     * Public asynchronously core methods for string comparison
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide the asynchronous core functionality for string comparison,
     * phonetic indexing and text search, allowing for non-blocking operations.
     */

    /**
     * Asynchronously performs a single metric comparison.
     * 
     * @param {string} a - The source string
     * @param {string} b - The target string
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The metric result
     */
    public async testAsync<T extends CmpStrResult | MetricResultSingle<R>> (
        a: string, b: string, opt?: CmpStrOptions
    ) : Promise<T> {

        return this.computeAsync<T>( a, b, opt, 'single' );

    }

    /**
     * Asynchronously performs a single metric comparison returning the numeric score.
     * 
     * @param {string} a - The source string
     * @param {string} b - The target string
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<number>} - The similarity score (0..1)
     */
    public async compareAsync ( a: string, b: string, opt?: CmpStrOptions ) : Promise<number> {

        return ( await this.computeAsync<MetricResultSingle<R>>( a, b, opt, 'single', true ) ).res;

    }

    /**
     * Asynchronously performs a batch metric comparison between source and target
     * strings or array of strings.
     * 
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The batch metric results
     */
    public async batchTestAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : Promise<T> {

        return this.computeAsync<T>( a, b, opt, 'batch' );

    }

    /**
     * Asynchronously performs a batch metric comparison and returns results sorted by score.
     * 
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {'desc'|'asc'} [dir='desc'] - Sort direction (desc, asc)
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The sorted batch results
     */
    public async batchSortedAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, dir: 'desc' | 'asc' = 'desc', opt?: CmpStrOptions
    ) : Promise<T> {

        const res = await this.computeAsync<MetricResultBatch<R>>( a, b, opt, 'batch', true );

        return this.output(
            res.sort( ( a, b ) => dir === 'asc' ? a.res - b.res : b.res - a.res ),
            opt?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Asynchronously performs a pairwise metric comparison between source and target
     * strings or array of strings.
     * 
     * Input arrays needs of the same length to perform pairwise comparison,
     * otherwise the method will throw an error.
     * 
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The pairwise metric results
     */
    public async pairsAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : Promise<T> {

        return this.computeAsync<T>( a, b, opt, 'pairwise' );

    }

    /**
     * Asynchronously performs a batch comparison and returns only results above the threshold.
     * 
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {number} threshold - The similarity threshold (0..1)
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The filtered batch results
     */
    public async matchAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, threshold: number, opt?: CmpStrOptions
    ) : Promise<T> {

        const res = await this.computeAsync<MetricResultBatch<R>>( a, b, opt, 'batch', true );

        return this.output(
            res.filter( r => r.res >= threshold ).sort( ( a, b ) => b.res - a.res ),
            opt?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Asynchronously returns the n closest matches from a batch comparison.
     * 
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {number} [n=1] - Number of closest matches
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The closest matches
     */
    public async closestAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, n: number = 1, opt?: CmpStrOptions
    ) : Promise<T> {

        return ( await this.batchSortedAsync( a, b, 'desc', opt ) ).slice( 0, n ) as T;

    }

    /**
     * Asynchronously returns the n furthest matches from a batch comparison.
     * 
     * @param {MetricInput} a - The source string or array of strings
     * @param {MetricInput} b - The target string or array of strings
     * @param {number} [n=1] - Number of furthest matches
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<T>} - The furthest matches
     */
    public async furthestAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, n: number = 1, opt?: CmpStrOptions
    ) : Promise<T> {

        return ( await this.batchSortedAsync( a, b, 'asc', opt ) ).slice( 0, n ) as T;

    }

    /**
     * Asynchronously performs a normalized and filtered substring search.
     * 
     * @param {string} needle - The search string
     * @param {string[]} haystack - The array to search in
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @param {CmpStrProcessors} [processors] - Pre-processors to apply
     * @returns {Promise<string[]>} - Array of matching entries
     */
    public async searchAsync (
        needle: string, haystack: string[], flags?: NormalizeFlags,
        processors?: CmpStrProcessors
    ) : Promise<string[]> {

        const resolved: CmpStrOptions = this.resolveOptions( { flags, processors } );

        // Prepare the needle and haystack, normalizing and filtering them
        const test: string = await this.prepareAsync( needle, resolved ) as string;
        const hstk: string[] = await this.prepareAsync( haystack, resolved ) as string[];

        // Filter the haystack based on the normalized test string
        return haystack.filter( ( _, i ) => hstk[ i ].includes( test ) );

    }

    /**
     * Asynchronously computes a similarity matrix for the given input array.
     * 
     * @param {string[]} input - The input array
     * @param {CmpStrOptions} [opt] - Optional options
     * @returns {Promise<number[][]>} - The similarity matrix
     */
    public async matrixAsync ( input: string[], opt?: CmpStrOptions ) : Promise<number[][]> {

        input = await this.prepareAsync( input, this.resolveOptions( opt ) ) as string[];

        return Promise.all( input.map( async a => (
            await this.computeAsync<MetricResultBatch<R>>(
                a, input, undefined, 'batch', true, true
            ).then( r => r.map( b => b.res ?? 0 ) ) )
        ) );

    }

    /**
     * Asynchronously computes the phonetic index for a string using the
     * configured or given algorithm.
     * 
     * @param {string} [input] - The input string
     * @param {string} [algo] - The phonetic algorithm to use
     * @param {PhoneticOptions} [opt] - Optional phonetic options
     * @returns {Promise<string>} - The phonetic index as a string
     */
    public async phoneticIndexAsync (
        input: string, algo?: string, opt?: PhoneticOptions
    ) : Promise<string> {

        const { algo: a, opt: o } = this.options.processors?.phonetic ?? {};

        return this.indexAsync( input, {
            algo: ( algo ?? a )!, opt: opt ?? o
        } ) as Promise<string>;

    }

}