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
    CmpStrParams, CmpStrPhoneticParams, CmpStrResult, NormalizeFlags, MetricInput,
    MetricMode, MetricRaw, MetricResult, MetricResultSingle, MetricResultBatch
} from './utils/Types';

import { CmpStr } from './CmpStr';
import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';

import { MetricCls } from './metric';
import { PhoneticCls } from './phonetic';

/**
 * The CmpStrAsync class provides a fully asynchronous API for string comparison,
 * phonetic indexing, filtering and normalization.
 *
 * @template R - The type of the metric result, defaults to MetricRaw
 */
export class CmpStrAsync<R = MetricRaw> extends CmpStr<R> {

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

        const { normalizeFlags } = this.options;

        return Normalizer.normalizeAsync( input, flags ?? normalizeFlags ?? '' );

    }

    /**
     * Asynchronously applies all active filters to the input string or array.
     * 
     * @param {MetricInput} input - The input string or array
     * @param {string} [hook='input'] - The filter hook
     * @returns {Promise<MetricInput>} - The filtered input
     */
    protected async filterAsync ( input: MetricInput, hook: string = 'input' ) : Promise<MetricInput> {

        return Array.isArray( input )
            ? Promise.all( input.map( async ( s ) => await Filter.applyAsync( hook, s ) ) )
            : Filter.applyAsync( hook, input as string );

    }

    /**
     * Asynchronously prepares the input by normalizing and filtering.
     * 
     * @param {MetricInput} [input] - The input string or array
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @param {string} [hook='input'] - The filter hook
     * @returns {Promise<MetricInput|undefined>} - The prepared input
     */
    protected async prepareAsync (
        input?: MetricInput, flags?: NormalizeFlags, hook: string = 'input'
    ) : Promise<MetricInput | undefined> {

        return input === undefined ? undefined : (
            this.filterAsync( await this.normalizeAsync( input, flags ), hook )
        );

    }

    /**
     * Asynchronously computes a metric result for the given target and mode.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {CmpStrParams} [args] - Additional parameters
     * @param {MetricMode} [mode] - The optional metric mode
     * @returns {Promise<T>} - The computed result
     */
    protected async computeAsync<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        target: MetricInput, args?: CmpStrParams, mode?: MetricMode
    ) : Promise<T> {

        const { flags, opt, raw, metric, source } = args ?? {};

        // Prepare the source and target inputs, resolving the metric class
        const src: MetricInput | undefined = await this.prepareAsync( source ?? this.source, flags );
        const tgt: MetricInput = ( await this.prepareAsync( target ?? '', flags ) )!;
        const cls: MetricCls<R> = this.resolveCls<MetricCls<R>>( 'metric', metric );

        this.check( [ 'source', src ], [ 'metric', cls ] );

        // Get a new instance of the metric class with merged options
        const cmp = new cls! ( src, tgt, this.deepMerge( this.options.metricOptions, opt ) );

        // Asynchronously compute the metric result
        await cmp.runAsync( mode );

        // Resolve and return the result based on the raw flag
        return this.resolveResult<T>( cmp.getResults(), raw ) as T;

    }

    /**
     * Asynchronously computes the phonetic index for a string using the configured algorithm.
     * 
     * @param {string} [input] - The input string
     * @param {CmpStrPhoneticParams} [args] - Phonetic options
     * @returns {Promise<string[]>} - The phonetic index as an array of codes
     */
    protected async indexAsync ( input?: string, args?: CmpStrPhoneticParams ) : Promise<string[]> {

        const { flags, opt, algo } = args ?? {};

        // Prepare the input string, resolving the phonetic class
        const src: string = await this.prepareAsync( this.asStr( input ?? this.source ?? '' ), flags ) as string;
        const cls: PhoneticCls = this.resolveCls<PhoneticCls>( 'phonetic', algo );

        this.check( [ 'source', src ], [ 'phonetic', cls ] );

        // Get a new instance of the phonetic class with merged options
        const phonetic = new cls! ( this.deepMerge( this.options.phoneticOptions, opt ) );

        // Asynchronously compute the phonetic index and return it
        return phonetic.getIndexAsync( src );

    }

    /**
     * ---------------------------------------------------------------------------------
     * Public asynchronously methods for string comparison and phonetic indexing
     * ---------------------------------------------------------------------------------
     * 
     * These methods provide the asynchronous core functionality for string comparison,
     * phonetic indexing and metric computation, allowing for non-blocking operations.
     */

    /**
     * Asynchronously performs a single metric comparison between the source and target.
     * 
     * @param {string} target - The target string
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The metric result
     */
    public async testAsync<T extends CmpStrResult | MetricResultSingle<R>> (
        target: string, args?: CmpStrParams
    ) : Promise<T> {

        return this.computeAsync<T>( target, args, 'single' );

    }

    /**
     * Asynchronously performs a single metric comparison and returns only the numeric score.
     * 
     * @param {string} target - The target string
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<number>} - The similarity score (0..1)
     */
    public async compareAsync ( target: string, args?: CmpStrParams ) : Promise<number> {

        return ( await this.computeAsync<MetricResultSingle<R>>( target, {
            ...args, ...{ raw: true }
        }, 'single' ) ).res;

    }

    /**
     * Asynchronously performs a batch metric comparison between the source and target.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The batch metric results
     */
    public async batchTestAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, args?: CmpStrParams
    ) : Promise<T> {

        return this.computeAsync<T>( target, args, 'batch' );

    }

    /**
     * Asynchronously performs a batch metric comparison and returns results sorted by score.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {'desc'|'asc'} [dir='desc'] - Sort direction
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The sorted batch results
     */
    public async batchSortedAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, dir: 'desc' | 'asc' = 'desc', args?: CmpStrParams
    ) : Promise<T> {

        const arr = await this.batchTestAsync<MetricResultBatch<R>>( target, {
            ...args, ...{ raw: true }
        } );

        return this.resolveResult(
            arr.sort( ( a, b ) => dir === 'asc' ? a.res - b.res : b.res - a.res ),
            args?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Asynchronously performs a pairwise metric comparison between the source and target arrays.
     * 
     * @param {MetricInput} target - The target array
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The pairwise metric results
     */
    public async pairsAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, args?: CmpStrParams
    ) : Promise<T> {

        return this.computeAsync<T>( target, args, 'pairwise' );

    }

    /**
     * Asynchronously performs a batch comparison and returns only results above the threshold.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {number} threshold - The similarity threshold (0..1)
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The filtered batch results
     */
    public async matchAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, threshold: number, args?: CmpStrParams
    ) : Promise<T> {

        const arr = await this.batchTestAsync<MetricResultBatch<R>>( target, {
            ...args, ...{ raw: true }
        } );

        return this.resolveResult(
            arr.filter( r => r.res >= threshold ).sort( ( a, b ) => b.res - a.res ),
            args?.raw ?? this.options.raw
        ) as T;

    }

    /**
     * Asynchronously returns the n closest matches from a batch comparison.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {number} [n=1] - Number of closest matches
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The closest matches
     */
    public async closestAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, n: number = 1, args?: CmpStrParams
    ) : Promise<T> {

        return ( await this.batchSortedAsync( target, 'desc', args ) ).slice( 0, n ) as T;

    }

    /**
     * Asynchronously returns the n furthest matches from a batch comparison.
     * 
     * @param {MetricInput} target - The target string or array
     * @param {number} [n=1] - Number of furthest matches
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<T>} - The furthest matches
     */
    public async furthestAsync<T extends CmpStrResult[] | MetricResultBatch<R>> (
        target: MetricInput, n: number = 1, args?: CmpStrParams
    ) : Promise<T> {

        return ( await this.batchSortedAsync( target, 'asc', args ) ).slice( 0, n ) as T;

    }

    /**
     * Asynchronously performs a normalized and filtered substring search.
     * 
     * @param {string} needle - The search string
     * @param {string[]} [haystack] - The array to search in (defaults to source)
     * @param {NormalizeFlags} [flags] - Normalization flags
     * @returns {Promise<string[]>} - Array of matching entries
     */
    public async searchAsync (
        needle: string, haystack?: string[], flags?: NormalizeFlags
    ) : Promise<string[]> {

        this.check( [ 'source', haystack ] );

        // Prepare the needle and haystack, normalizing and filtering them
        const test: string = await this.prepareAsync( needle, flags ) as string;
        const src: string[] = this.asArr( haystack ?? this.source );
        const hstk: string[] = await this.prepareAsync( src, flags ) as string[];

        // Asynchronously filter the haystack based on the normalized test string
        return Promise.all( hstk.map( async ( h, i ) => h.includes( test ) ? src[ i ] : null ) )
            .then( results => results.filter( ( v ) : v is string => v !== null ) );

    }

    /**
     * Asynchronously computes a similarity matrix for the given input array.
     * 
     * @param {string[]} input - The input array
     * @param {CmpStrParams} [args] - Additional parameters
     * @returns {Promise<number[][]>} - The similarity matrix
     */
    public async matrixAsync ( input: string[], args?: CmpStrParams ) : Promise<number[][]> {

        input = await this.prepareAsync( input, args?.flags ) as string[];

        return Promise.all( input.map( async a => (
            Promise.all( input.map( async b => (
                await this.computeAsync<MetricResultSingle<R>>(
                    b, { flags: '', raw: true, source: a }, 'single'
                )
            ).res ?? 0 ) )
        ) ) );

    }

    /**
     * Asynchronously computes the phonetic index for a string using the configured algorithm.
     * 
     * @param {string} [input] - The input string
     * @param {CmpStrPhoneticParams} [args] - Phonetic options
     * @returns {Promise<string>} - The phonetic index as a string
     */
    public async phoneticIndexAsync ( input?: string, args?: CmpStrPhoneticParams ) : Promise<string> {

        return ( await this.indexAsync( input, args ) ).join( ' ' );

    }

    /**
     * Asynchronously performs a phonetic-aware search in the haystack.
     * 
     * @param {string} needle - The search string
     * @param {string[]} [haystack] - The array to search in (defaults to source)
     * @param {CmpStrPhoneticParams} [args] - Phonetic options
     * @returns {Promise<string[]>} - Array of matching entries
     */
    public async phoneticSearchAsync (
        needle: string, haystack?: string[], args?: CmpStrPhoneticParams
    ) : Promise<string[]> {

        this.check( [ 'source', haystack ], [ 'phonetic', args?.algo ] );

        // Compute the phonetic index for the needle and haystack
        const test: string = ( await this.indexAsync( needle, args ) ).join( ' ' );
        const src: string[] = this.asArr( haystack ?? this.source );
        const hstk: string[] = await Promise.all( src.map( s => (
            this.indexAsync( s, args ).then( arr => arr.join( ' ' ) )
        ) ) );

        // Asynchronously filter the haystack based on the phonetic index of the test string
        return Promise.all( hstk.map( async ( h, i ) => h.includes( test ) ? src[ i ] : null ) )
            .then( results => results.filter( ( v ) : v is string => v !== null ) );

    }

};