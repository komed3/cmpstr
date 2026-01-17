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
    CmpStrOptions, MetricRaw, MetricResultSingle, StructuredDataOptions,
    StructuredDataResult
} from './Types';

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
    public static create<T = any, R = MetricRaw> (
        data: T[], key: string | number | symbol
    ) : StructuredData<T, R> {

        return new StructuredData ( data, key );

    }

    // The data array to process (cached for performance)
    protected data: T[];

    // The property key to extract (cached for performance)
    protected key: string | number | symbol;

    /**
     * Creates a new StructuredData instance.
     *
     * @param {T[]} data - The array of objects to process
     * @param {string|number|symbol} key - The property key to extract for comparison
     */
    private constructor ( data: T[], key: string | number | symbol ) {

        this.data = data;
        this.key = key;

    }

    /**
     * Extracts properties from another array.
     * 
     * @param {T[]} arr - The array to extract from
     * @param {string|number|symbol} key - The property key
     * @returns {string[]} - Array of extracted strings
     */
    private extractFrom ( arr: T[], key: string | number | symbol ) : string[] {

        return arr.map( item => String ( ( item as any )[ key ] ?? '' ) );

    }

    /**
     * Extracts string values from the data array using the configured key.
     * 
     * @returns {string[]} - Array of extracted strings
     */
    protected extract () : string[] {

        return this.extractFrom( this.data, this.key );

    }

    /**
     * Normalizes metric results to a consistent format.
     * Handles both CmpStrResult[] and MetricResultBatch<R> formats.
     * 
     * @param {any} results - The raw metric results
     * @returns {MetricResultSingle<R>[]} - Normalized single results array
     */
    private normalizeResults ( results: any ) : MetricResultSingle<R>[] {

        // If already an array of MetricResultSingle, return as-is
        if ( Array.isArray( results ) && results.length ) {

            const first = results[ 0 ];

            // Check if it's MetricResultSingle format (has 'a', 'b', 'res')
            if ( 'a' in first && 'b' in first && 'res' in first ) return results as MetricResultSingle<R>[];

            // Check if it's CmpStrResult format (has 'source', 'target', 'match')
            if ( 'source' in first && 'target' in first && 'match' in first ) return results.map(
                r => ( { metric: 'unknown', a: r.source, b: r.target, res: r.match, raw: r.raw } )
            ) as MetricResultSingle<R>[];

        }

        return results || [];

    }

    /**
     * Rebuilds results with original objects attached.
     * 
     * @param {MetricResultSingle<R>[]} results - The normalized metric results
     * @param {T[]} sourceData - The source data array for object attachment
     * @param {boolean} [removeZero] - Whether to remove zero similarity results
     * @param {boolean} [objectsOnly] - Return only objects without metadata
     * @returns {any} - Results with objects (or just objects if objectsOnly=true)
     */
    private rebuild (
        results: MetricResultSingle<R>[],
        sourceData: T[],
        removeZero?: boolean,
        objectsOnly?: boolean
    ) : any {

        return results.reduce( ( acc, result, i ) => {

            // Skip zero results if configured
            if ( removeZero && result.res === 0 ) return acc;

            // Build the result object
            const item: StructuredDataResult<T, R> = {
                obj: sourceData[ i ], key: this.key, result: {
                    source: result.a, target: result.b, match: result.res
                }
            };

            // Attach raw data if present
            if ( result.raw ) item.raw = result.raw;

            // Push either full result or just the object
            acc.push( objectsOnly ? item.obj : item );

            return acc;

        }, [] as any );

    }

    /**
     * Sorts results in-place by match score.
     * 
     * @param {any[]} results - The results to sort
     * @param {string|boolean} [sort] - Sort direction (asc, desc, or boolean true=desc)
     * @returns {any[]} - Sorted results
     */
    private sort ( results: any[], sort?: string | boolean ) : any[] {

        if ( !sort || results.length <= 1 ) return results;

        const isAsc = sort === 'asc';
        const getMatch = ( item: any ) => item.match !== undefined ? item.match : item.result?.match ?? 0;

        return results.sort( ( a, b ) => {

            const aMatch = getMatch( a );
            const bMatch = getMatch( b );

            return isAsc ? aMatch - bMatch : bMatch - aMatch;

        } );

    }

    /**
     * Performs a lookup with a synchronous comparison function.
     * 
     * @param {string} query - The query string to compare against
     * @param {( a: string, b: string[], opt?: CmpStrOptions ) => any} fn - The comparison function
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {any} - The lookup results
     */
    private async lookup (
        fn: () => any | Promise<any>,
        opt?: StructuredDataOptions
    ) : Promise<any> {

        // Get raw results (sync or async)
        const rawResults = await fn();

        // Normalize results to MetricResultSingle<R>[]
        const normalized = this.normalizeResults( rawResults );

        // Rebuild with original objects
        const rebuilt = this.rebuild( normalized, this.data, opt?.removeZero, opt?.objectsOnly );

        // Sort if requested
        return this.sort( rebuilt, opt?.sort );

    }

    /**
     * Performs a batch comparison against a query string.
     * 
     * @param {string} query - The query string to compare against
     * @param {(a: string, b: string[], opt?: CmpStrOptions) => any} fn - The comparison function
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult<T, R> | T[]} - Results with objects or just objects
     */
    public batchLookup (
        query: string,
        fn: ( a: string, b: string[], opt?: CmpStrOptions ) => any,
        opt?: StructuredDataOptions
    ) : any {

        return this.lookup( () => fn( query, this.extract(), opt ), opt );

    }

}
