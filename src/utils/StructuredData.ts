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
 * @module Utils
 * @name StructuredData
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type {
    CmpFnResult, CmpStrOptions, CmpStrResult, IndexedResult, MetricRaw, MetricResultSingle,
    StructuredDataBatchResult, StructuredDataOptions, StructuredDataResult
} from './Types';

import { CmpStrValidationError, ErrorUtil } from './Errors';
import { Pool } from './Pool';


/**
 * The StructuredData class provides factory methods for processing arrays of
 * structured objects with string comparison capabilities.
 * 
 * @template T - The type of objects in the data array
 * @template R - The type of the metric raw result
 */
export class StructuredData< T = any, R = MetricRaw > {

    /** Sorting functions for ascending and descending order based on the 'res' property. */
    private static readonly SORT_ASC = ( a: IndexedResult< any >, b: IndexedResult< any > ) => a.res - b.res;
    private static readonly SORT_DESC = ( a: IndexedResult< any >, b: IndexedResult< any > ) => b.res - a.res;

    /**
     * Creates a new StructuredData instance for processing structured data.
     * 
     * @param {T[]} data - The array of objects to process
     * @param {keyof T} key - The property key to extract for comparison
     * @returns {StructuredData< T, R >} - A new class instance
     */
    public static create< T = any, R = MetricRaw > ( data: T[], key: keyof T ) : StructuredData< T, R > {
        return new StructuredData ( data, key );
    }

    /**
     * Creates a new StructuredData instance.
     *
     * @param {T[]} data - The array of objects to process
     * @param {keyof T} key - The property key to extract for comparison
     */
    private constructor ( private readonly data: T[], private readonly key: keyof T ) {}

    /**
     * Extracts properties from another array.
     * 
     * @template A - The type of objects in the array
     * @param {A[]} arr - The array to extract from
     * @param {keyof A} key - The property key
     * @returns {string[]} - Array of extracted strings
     */
    private extractFrom< A > ( arr: readonly A[], key: keyof A ) : string[] {
        const n = arr.length;
        const result = new Array< string > ( n );

        for ( let i = 0; i < n; i++ ) {
            const val = arr[ i ][ key ];
            result[ i ] = val != null ? String( val ) : '';
        }

        return result;
    }

    /**
     * Extracts string values from the data array using the configured key.
     * 
     * @returns {string[]} - Array of extracted strings
     */
    private extract () : string[] {
        return this.extractFrom< T >( this.data, this.key );
    }

    /**
     * Type guard to check if a value is MetricResultSingle<R>.
     * 
     * @param {unknown} v - The value to check
     * @returns {v is MetricResultSingle< R >} - True if v is MetricResultSingle<R>
     */
    private isMetricResult ( v: unknown ) : v is MetricResultSingle< R > {
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
     * Attaches original indices for correct mapping after sorting.
     * Handles both CmpStrResult[] and MetricResultBatch<R> formats.
     * 
     * @param {any} results - The raw metric results
     * @returns {IndexedResult< R >[]} - Normalized results with indices
     * @throws {CmpStrValidationError} - If the results format is unsupported
     */
    private normalizeResults ( results: CmpFnResult< R > ) : IndexedResult< R >[] {
        if ( ! Array.isArray( results ) || results.length === 0 ) return [];

        const first = results[ 0 ];
        let out = new Array< IndexedResult< R > >( results.length );

        // Check if it's MetricResultSingle format
        if ( this.isMetricResult( first ) ) {
            const src = results as MetricResultSingle< R >[];
            for ( let i = 0; i < src.length; i++ ) out[ i ] = { ...src[ i ], __idx: i };
        }

        // Check if it's CmpStrResult format -> convert to MetricResultSingle
        else if ( this.isCmpStrResult( first ) ) {
            const src = results as ( CmpStrResult & { raw?: R } )[];

            for ( let i = 0; i < src.length; i++ ) {
                const r = src[ i ];
                out[ i ] = {
                    metric: 'unknown', a: r.source, b: r.target,
                    res: r.match, raw: r.raw, __idx: i
                };
            }
        }

        // Throw on unsupported format
        else throw new CmpStrValidationError (
            'Unsupported result format for StructuredData normalization.'
        );

        return out;
    }

    /**
     * Rebuilds results with original objects attached.
     * Maps results to source objects using target string matching with duplicate handling.
     * Works correctly even when results are filtered or subset (e.g., from closest/furthest).
     * 
     * @param {IndexedResult< R >[]} results - The normalized metric results
     * @param {T[]} sourceData - The source data array for object attachment
     * @param {string[]} extractedStrings - The extracted strings array for index mapping
     * @param {boolean} [removeZero] - Whether to remove zero similarity results
     * @param {boolean} [objectsOnly] - Return only objects without metadata
     * @returns {StructuredDataResult< T, R >[] | T[]} - Results with objects (or just objects if objectsOnly=true)
     */
    private rebuild (
        results: IndexedResult< R >[], sourceData: T[], extractedStrings: string[],
        removeZero?: boolean, objectsOnly?: boolean
    ) : StructuredDataResult< T, R >[] | T[] {
        const m = extractedStrings.length, n = results.length;
        const stringToIndices = Pool.acquire< Map< string, number[] > >( 'map', m );
        const occurrenceCount = Pool.acquire< Map< string, number > >( 'map', n );
        const output = new Array< StructuredDataResult< T, R > | T >( n );

        stringToIndices.clear();
        occurrenceCount.clear();

        try {
            for ( let i = 0; i < m; i++ ) {
                const str = extractedStrings[ i ];
                let arr = stringToIndices.get( str );

                if ( ! arr ) { arr = []; stringToIndices.set( str, arr ) }
                arr.push( i );
            }

            let out = 0;

            for ( let i = 0; i < n; i++ ) {
                const result = results[ i ];

                // Skip zero results if configured
                if ( removeZero && result.res === 0 ) continue;

                const targetStr = result.b || '';
                const indices = stringToIndices.get( targetStr );

                // Fall back to positional index if string not found
                let dataIndex: number;

                if ( indices && indices.length > 0 ) {
                    // Track occurrence of this value in results
                    const occurrence = occurrenceCount.get( targetStr ) ?? 0;
                    occurrenceCount.set( targetStr, occurrence + 1 );
                    // Cycle through duplicates
                    dataIndex = indices[ occurrence % indices.length ];
                } else {
                    // If no match found, use the original position indicator
                    dataIndex = result.__idx ?? i;
                }

                // Ensure dataIndex is valid
                if ( dataIndex < 0 || dataIndex >= sourceData.length ) continue;

                const sourceObj = sourceData[ dataIndex ];
                const mappedTarget = extractedStrings[ dataIndex ] || targetStr;

                // If objectsOnly, push just the original object
                if ( objectsOnly ) output[ out++ ] = sourceObj;

                // Build the result object
                else output[ out++ ] = {
                    obj: sourceObj, key: this.key, result: {
                        source: result.a, target: mappedTarget, match: result.res
                    }, ...( result.raw ? { raw: result.raw } : null )
                };
            }

            output.length = out;
            return output as StructuredDataResult< T, R >[] | T[];
        } finally {
            Pool.release< Map< string, number[] > >( 'map', stringToIndices, m );
            Pool.release< Map< string, number > >( 'map', occurrenceCount, n );
        }
    }

    /**
     * Sorts results in-place by match score.
     * Preserves __idx for tracking original positions.
     * 
     * @param {IndexedResult< R >[]} results - The results to sort
     * @param {string | boolean} [sort] - Sort direction (asc, desc, or boolean true=desc)
     * @returns {IndexedResult< R >[]} - Sorted results
     */
    private sort ( results: IndexedResult< R >[], sort?: string | boolean ) : IndexedResult< R >[] {
        if ( ! sort || results.length <= 1 ) return results;
        return results.sort( sort === 'asc' ? StructuredData.SORT_ASC : StructuredData.SORT_DESC );
    }

    /**
     * Finalizes the lookup process by normalizing, sorting, and rebuilding results.
     * 
     * @param {CmpFnResult< R >} results - The raw metric results
     * @param {string[]} extractedStrings - The extracted strings for index mapping
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {StructuredDataBatchResult< T, R > | T[]} - The finalized lookup results
     */
    private finalizeLookup (
        results: CmpFnResult< R >, extractedStrings: string[], opt?: StructuredDataOptions
    ) : StructuredDataBatchResult< T, R > | T[] {
        return this.rebuild(
            this.sort( this.normalizeResults( results ), opt?.sort ),
            this.data, extractedStrings, opt?.removeZero, opt?.objectsOnly
        );
    }

    /**
     * Performs a lookup with a synchronous comparison function.
     * 
     * @param {() => CmpFnResult< R >} fn - The comparison function
     * @param {string[]} extractedStrings - The extracted strings for index mapping
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {StructuredDataBatchResult< T, R > | T[]} - The lookup results
     * @throws {CmpStrUsageError} - If the lookup process fails
     */
    private performLookup(
        fn: () => CmpFnResult< R >, extractedStrings: string[], opt?: StructuredDataOptions
    ) : StructuredDataBatchResult< T, R > | T[] {
        return ErrorUtil.wrap< StructuredDataBatchResult< T, R > | T[] >( () =>
            this.finalizeLookup( fn(), extractedStrings, opt ),
            'StructuredData lookup failed', { key: this.key }
        );
    }

    /**
     * Performs a lookup with an asynchronous comparison function.
     * 
     * @param {() => Promise< CmpFnResult< R > >} fn - The async comparison function
     * @param {string[]} extractedStrings - The extracted strings for index mapping
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {Promise< StructuredDataBatchResult< T, R > | T[] >} - The async lookup results
     * @throws {CmpStrUsageError} - If the async lookup process fails
     */
    private async performLookupAsync (
        fn: () => Promise< CmpFnResult< R > >, extractedStrings: string[], opt?: StructuredDataOptions
    ) : Promise< StructuredDataBatchResult< T, R > | T[] > {
        return await ErrorUtil.wrapAsync< StructuredDataBatchResult< T, R > | T[] >( async () =>
            this.finalizeLookup( await fn(), extractedStrings, opt ),
            'StructuredData async lookup failed', { key: this.key }
        );
    }

    /**
     * Performs a batch comparison against a query string.
     * 
     * @param {() => CmpFnResult< R >} fn - The comparison function
     * @param {string} query - The query string to compare against
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult< T, R > | T[]} - Results with objects or just objects
     */
    public lookup (
        fn: ( a: string, b: string[], opt?: CmpStrOptions ) => CmpFnResult< R >,
        query: string, opt?: StructuredDataOptions
    ) : StructuredDataBatchResult< T, R > | T[] {
        const b = this.extract();

        try { return this.performLookup( () => fn( query, b, opt ), b, opt ) }
        finally { Pool.release( 'string[]', b, b.length ) }
    }

    /**
     * Asynchronously performs a batch comparison against a query string.
     * 
     * @param {() => Promise< CmpFnResult< R > >} fn - The async comparison function
     * @param {string} query - The query string to compare against
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {Promise< StructuredDataBatchResult< T, R > | T[] >} - Async results
     */
    public async lookupAsync (
        fn: ( a: string, b: string[], opt?: CmpStrOptions ) => Promise< CmpFnResult< R > >,
        query: string, opt?: StructuredDataOptions
    ) : Promise< StructuredDataBatchResult< T, R > | T[] > {
        const b = this.extract();

        try { return await this.performLookupAsync( () => fn( query, b, opt ), b, opt ) }
        finally { Pool.release( 'string[]', b, b.length ) }
    }

    /**
     * Performs a pairwise comparison against another array of objects.
     * 
     * @template O - The type of objects in the other array
     * @param {() => CmpFnResult< R >} fn - The comparison function
     * @param {O[]} other - The other array of objects
     * @param {keyof O} otherKey - The property key in the other array
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {StructuredDataBatchResult< T, R > | T[]} - Results with objects or just objects
     */
    public lookupPairs< O = any > (
        fn: ( a: string[], b: string[], opt?: CmpStrOptions ) => CmpFnResult< R >,
        other: O[], otherKey: keyof O, opt?: StructuredDataOptions
    ) : StructuredDataBatchResult< T, R > | T[] {
        const a = this.extract();
        const b = this.extractFrom< O >( other, otherKey );

        try { return this.performLookup( () => fn( a, b, opt ), a, opt ) }
        finally {
            Pool.release( 'string[]', a, a.length );
            Pool.release( 'string[]', b, b.length );
        }
    }

    /**
     * Asynchronously performs a pairwise comparison against another array of objects.
     * 
     * @template O - The type of objects in the other array
     * @param {() => Promise< CmpFnResult< R > >} fn - The async comparison function
     * @param {O[]} other - The other array of objects
     * @param {keyof O} otherKey - The property key in the other array
     * @param {StructuredDataOptions} [opt] - Optional lookup options
     * @returns {Promise< StructuredDataBatchResult< T, R > | T[] >} - Async results
     */
    public async lookupPairsAsync< O = any > (
        fn: ( a: string[], b: string[], opt?: CmpStrOptions ) => Promise< CmpFnResult< R > >,
        other: O[], otherKey: keyof O, opt?: StructuredDataOptions
    ) : Promise< StructuredDataBatchResult< T, R > | T[] > {
        const a = this.extract();
        const b = this.extractFrom< O >( other, otherKey );

        try { return await this.performLookupAsync( () => fn( a, b, opt ), a, opt ) }
        finally {
            Pool.release( 'string[]', a, a.length );
            Pool.release( 'string[]', b, b.length );
        }
    }

}
