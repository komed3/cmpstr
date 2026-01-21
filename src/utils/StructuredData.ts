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
    CmpFnResult, CmpStrOptions, CmpStrResult, IndexedResult, MetricRaw, MetricResultSingle,
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
export class StructuredData< T = any, R = MetricRaw > {

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
        const result = Pool.acquire< string[] >( 'string[]', arr.length );

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
    private extract = () : string[] => this.extractFrom< T >( this.data, this.key );

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
     */
    private normalizeResults ( results: CmpFnResult< R > ) : IndexedResult< R >[] {
        if ( ! Array.isArray( results ) || results.length === 0 ) return [];

        const first = results[ 0 ];
        let normalized: IndexedResult< R >[] = [];

        // Check if it's MetricResultSingle format
        if ( this.isMetricResult( first ) ) normalized = results as MetricResultSingle< R >[];
        // Check if it's CmpStrResult format -> convert to MetricResultSingle
        else if ( this.isCmpStrResult( first ) ) normalized = ( results as ( CmpStrResult & { raw?: R } )[] )
            .map( r => ( { metric: 'unknown', a: r.source, b: r.target, res: r.match, raw: r.raw } ) );
        // Throw on unsupported format
        else throw new TypeError ( 'Unsupported result format for StructuredData normalization.' );

        // Attach original indices (position in the results array)
        return normalized.map( ( r, idx ) => ( { ...r, __idx: idx } ) );
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
        // Create map: string value -> indices in extractedStrings
        const stringToIndices: Map< string, number[] > = new Map();

        for ( let i = 0; i < extractedStrings.length; i++ ) {
            const str = extractedStrings[ i ];

            if ( ! stringToIndices.has( str ) ) stringToIndices.set( str, [] );
            stringToIndices.get( str )!.push( i );
        }

        const output = new Array<StructuredDataResult< T, R > | T>( results.length );
        const occurrenceCount: Map< string, number > = new Map();
        let out = 0;

        for ( let i = 0; i < results.length; i++ ) {
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

        // Determine sort direction and sort based on match score
        const asc = sort === 'asc';
        return results.sort( ( a, b ) => asc ? a.res - b.res : b.res - a.res );
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
     */
    private performLookup(
        fn: () => CmpFnResult< R >, extractedStrings: string[], opt?: StructuredDataOptions
    ) : StructuredDataBatchResult< T, R > | T[] {
        return this.finalizeLookup( fn(), extractedStrings, opt );
    }

    /**
     * Performs a lookup with an asynchronous comparison function.
     * 
     * @param {() => Promise< CmpFnResult< R > >} fn - The async comparison function
     * @param {string[]} extractedStrings - The extracted strings for index mapping
     * @param {StructuredDataOptions} [opt] - Additional options
     * @returns {Promise< StructuredDataBatchResult< T, R > | T[] >} - The async lookup results
     */
    private async performLookupAsync (
        fn: () => Promise< CmpFnResult< R > >, extractedStrings: string[], opt?: StructuredDataOptions
    ) : Promise< StructuredDataBatchResult< T, R > | T[] > {
        return this.finalizeLookup( await fn(), extractedStrings, opt );
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
