/**
 * StructuredData - Structured Data Processing Utility
 * src/utils/StructuredData.ts
 * 
 * This utility provides a factory for processing arrays of structured objects,
 * enabling efficient lookups and comparisons on specific object properties.
 * 
 * Features:
 *  - Support for arbitrary object structures and property keys
 *  - Flexible extraction and transformation of object properties
 *  - Batch comparison with original object reconstruction
 *  - Full TypeScript type safety with generics
 *  - Integration with CmpStr comparison methods
 *  - Optional "objects-only" output mode for minimal result structure
 * 
 * @module Utils/StructuredData
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    CmpFnResult, CmpStrOptions, CmpStrResult, MetricRaw, MetricResultSingle,
    StructuredDataBatchResult, StructuredDataOptions, StructuredDataResult
} from './Types';

import { Pool } from './Pool';

/**
 * The StructuredData class provides factory methods for processing arrays of
 * structured objects with string comparison capabilities.
 * 
 * @template T - The type of objects in the data array
 * @template R - The type of the metric raw result
 */
export class StructuredData<T = any, R = MetricRaw> {

    /**
     * Creates a new StructuredData instance for processing structured data.
     * 
     * @param {T[]} data - The array of objects to process
     * @param {string|number|symbol} key - The property key to extract for comparison
     * @returns {StructuredData<T, R>} - A new class instance
     */
    public static create<T = any, R = MetricRaw> ( data: T[], key: keyof T ) : StructuredData<T, R> {

        return new StructuredData ( data, key );

    }

    // The data array to process (cached for performance)
    protected data: T[];

    // The property key to extract (cached for performance)
    protected key: keyof T;

    /**
     * Creates a new StructuredData instance.
     *
     * @param {T[]} data - The array of objects to process
     * @param {keyof T} key - The property key to extract for comparison
     */
    private constructor ( data: T[], key: keyof T ) {

        this.data = data;
        this.key = key;

    }

    /**
     * Extracts properties from another array.
     * 
     * @template A - The type of objects in the array
     * @param {A[]} arr - The array to extract from
     * @param {keyof A} key - The property key
     * @returns {string[]} - Array of extracted strings
     */
    private extractFrom<A> ( arr: readonly A[], key: keyof A ) : string[] {

        const result = Pool.acquire( 'string[]', arr.length );

        for ( let i = 0; i < arr.length; i++ ) {

            const val = arr[ i ][ key ];
            result[ i ] = typeof val === 'string' ? val : String( val ?? '' );

        }

        return result;

    }

    /**
     * Extracts string values from the data array using the configured key.
     * 
     * @returns {string[]} - Array of extracted strings
     */
    private extract () : string[] {

        return this.extractFrom<T>( this.data, this.key );

    }

    /**
     * Type guard to check if a value is MetricResultSingle<R>.
     * 
     * @param {unknown} v - The value to check
     * @returns {v is MetricResultSingle<R>} - True if v is MetricResultSingle<R>
     */
    private isMetricResult ( v: unknown ) : v is MetricResultSingle<R> {

        return typeof v === 'object' && v !== null && 'a' in v && 'b' in v && 'res' in v;

    }

    /**
     * Type guard to check if a value is CmpStrResult & { raw?: R }.
     * 
     * @param {unknown} v - The value to check
     * @returns {v is CmpStrResult & { raw?: R }
     */
    private isCmpStrResult ( v: unknown ) : v is CmpStrResult & { raw?: R } {

        return typeof v === 'object' && v !== null && 'source' in v && 'target' in v && 'match' in v;

    }

    /**
     * Normalizes metric results to a consistent format.
     * Handles both CmpStrResult[] and MetricResultBatch<R> formats.
     * 
     * @param {any} results - The raw metric results
     * @returns {MetricResultSingle<R>[]} - Normalized single results array
     */
    private normalizeResults ( results: CmpFnResult<R> ) : MetricResultSingle<R>[] {

        // Handle null/undefined results
        if ( ! Array.isArray( results ) || results.length === 0 ) return [];

        const first = results[ 0 ];

        // Check if it's MetricResultSingle format
        if ( this.isMetricResult( first ) ) return results as MetricResultSingle<R>[];

        // Check if it's CmpStrResult format -> convert to MetricResultSingle
        if ( this.isCmpStrResult( first ) ) return ( results as ( CmpStrResult & { raw?: R } )[] ).map(
            r => ( { metric: 'unknown', a: r.source, b: r.target, res: r.match, raw: r.raw } )
        );

        return [];

    }

    /**
     * Rebuilds results with original objects attached.
     * 
     * @param {MetricResultSingle<R>[]} results - The normalized metric results
     * @param {T[]} sourceData - The source data array for object attachment
     * @param {boolean} [removeZero] - Whether to remove zero similarity results
     * @param {boolean} [objectsOnly] - Return only objects without metadata
     * @returns {StructuredDataResult<T, R>[] | T[]} - Results with objects (or just objects if objectsOnly=true)
     */
    private rebuild (
        results: MetricResultSingle<R>[], sourceData: T[],
        removeZero?: boolean, objectsOnly?: boolean
    ) : StructuredDataResult<T, R>[] | T[] {

        const output = new Array<StructuredDataResult<T, R> | T>( results.length );
        let out = 0;

        for ( let i = 0; i < results.length; i++ ) {

            const result = results[ i ];

            // Skip zero results if configured
            if ( removeZero && result.res === 0 ) continue;

            // If objectsOnly, push just the original object
            if ( objectsOnly ) output[ out++ ] = sourceData[ i ];

            // Build the result object
            else output[ out++ ] = {
                obj: sourceData[ i ], key: this.key, result: {
                    source: result.a, target: result.b, match: result.res
                }, ...( result.raw ? { raw: result.raw } : null )
            };

        }

        output.length = out;
        return output as StructuredDataResult<T, R>[] | T[];

    }

    /**
     * Sorts results in-place by match score.
     * 
     * @param {StructuredDataResult<T, R>[]|T[]} results - The results to sort
     * @param {string|boolean} [sort] - Sort direction (asc, desc, or boolean true=desc)
     * @returns {StructuredDataResult<T, R>[]|T[]} - Sorted results
     */
    private sort (
        results: StructuredDataResult<T, R>[] | T[], sort?: string | boolean
    ) : StructuredDataResult<T, R>[] | T[] {

        // No sorting needed
        if ( ! sort || results.length <= 1 ) return results;

        // Determine sort direction
        const asc = sort === 'asc';

        // Helper to get match score from result
        const getMatch = ( v: StructuredDataResult<T, R> | T ) : number =>
            ( v as StructuredDataResult<T, R> ).result?.match ?? 0;

        // Sort based on match score
        return results.sort( ( a, b ) =>
            asc ? getMatch( a ) - getMatch( b )
                : getMatch( b ) - getMatch( a )
        );

    }

    /**
     * Performs a lookup with a synchronous comparison function.
     * 
     * @param {() => CmpFnResult<R>} fn - The comparison function
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {StructuredDataBatchResult<T, R>|T[]} - The lookup results
     */
    private performLookup (
        fn: () => CmpFnResult<R>,
        opt?: StructuredDataOptions
    ) : StructuredDataBatchResult<T, R> | T[] {

        return this.sort( this.rebuild(
            this.normalizeResults( fn() ),
            this.data, opt?.removeZero, opt?.objectsOnly
        ), opt?.sort );

    }

    /**
     * Performs a lookup with an asynchronous comparison function.
     * 
     * @param {() => Promise<CmpFnResult<R>>} fn - The async comparison function
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {Promise<StructuredDataBatchResult<T, R>|T[]>} - The async lookup results
     */
    private async performLookupAsync (
        fn: () => Promise<CmpFnResult<R>>,
        opt?: StructuredDataOptions
    ) : Promise<StructuredDataBatchResult<T, R> | T[]> {

        return this.sort( this.rebuild(
            this.normalizeResults( await fn() ),
            this.data, opt?.removeZero, opt?.objectsOnly
        ), opt?.sort );

    }

    /**
     * Performs a batch comparison against a query string.
     * 
     * @param {() => CmpFnResult<R>} fn - The comparison function
     * @param {string} query - The query string to compare against
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult<T, R>|T[]} - Results with objects or just objects
     */
    public lookup (
        fn: ( a: string, b: string[], opt?: CmpStrOptions ) => CmpFnResult<R>,
        query: string, opt?: StructuredDataOptions
    ) : StructuredDataBatchResult<T, R> | T[] {

        const extract = this.extract();

        try { return this.performLookup( () => fn( query, extract, opt ), opt ) }
        finally { Pool.release( 'string[]', extract, extract.length ) }

    }

    /**
     * Performs a pairwise comparison against another array of objects.
     * 
     * @template O - The type of objects in the other array
     * @param {() => CmpFnResult<R>} fn - The comparison function
     * @param {O[]} other - The other array of objects
     * @param {keyof O} otherKey - The property key in the other array
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult<T, R> | T[]} - Results with objects or just objects
     */
    public lookupPairs<O = any> (
        fn: ( a: string[], b: string[], opt?: CmpStrOptions ) => CmpFnResult<R>,
        other: O[], otherKey: keyof O, opt?: StructuredDataOptions
    ) : StructuredDataBatchResult<T, R> | T[] {

        const extract = this.extract();
        const extractOther = this.extractFrom<O>( other, otherKey );

        try { return this.performLookup( () => fn( extract, extractOther, opt ), opt ) }
        finally {

            Pool.release( 'string[]', extract, extract.length );
            Pool.release( 'string[]', extractOther, extractOther.length );

        }

    }

    /**
     * Asynchronously performs a batch comparison against a query string.
     * 
     * @param {() => Promise<CmpFnResult<R>>} fn - The async comparison function
     * @param {string} query - The query string to compare against
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {Promise<StructuredDataBatchResult<T, R> | T[]>} - Async results
     */
    public async lookupAsync (
        fn: ( a: string, b: string[], opt?: CmpStrOptions ) => Promise<CmpFnResult<R>>,
        query: string, opt?: StructuredDataOptions
    ) : Promise<StructuredDataBatchResult<T, R> | T[]> {

        const extract = this.extract();

        try { return await this.performLookupAsync( () => fn( query, extract, opt ), opt ) }
        finally { Pool.release( 'string[]', extract, extract.length ) }

    }

    /**
     * Asynchronously performs a pairwise comparison against another array of objects.
     * 
     * @template O - The type of objects in the other array
     * @param {() => Promise<CmpFnResult<R>>} fn - The async comparison function
     * @param {O[]} other - The other array of objects
     * @param {keyof O} otherKey - The property key in the other array
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {Promise<StructuredDataBatchResult<T, R> | T[]>} - Async results
     */
    public async lookupPairsAsync<O = any> (
        fn: ( a: string[], b: string[], opt?: CmpStrOptions ) => Promise<CmpFnResult<R>>,
        other: O[], otherKey: keyof O, opt?: StructuredDataOptions
    ) : Promise<StructuredDataBatchResult<T, R> | T[]> {

        const extract = this.extract();
        const extractOther = this.extractFrom<O>( other, otherKey );

        try { return await this.performLookupAsync( () => fn( extract, extractOther, opt ), opt ) }
        finally {

            Pool.release( 'string[]', extract, extract.length );
            Pool.release( 'string[]', extractOther, extractOther.length );

        }

    }

}
