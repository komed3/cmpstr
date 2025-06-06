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
    CmpStrOptions, CmpStrParams, CmpStrPhoneticParams, CmpStrResult, NormalizeFlags, DiffOptions,
    MetricInput, MetricMode, MetricRaw, MetricResult, MetricResultSingle, MetricResultBatch
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

};