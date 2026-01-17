'use strict';

import type { MetricRaw, MetricResultSingle } from './Types';

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
    protected constructor ( data: T[], key: string | number | symbol ) {

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
    protected extractFrom ( arr: T[], key: string | number | symbol ) : string[] {

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
    protected normalizeResults ( results: any ) : MetricResultSingle<R>[] {

        if ( Array.isArray( results ) && results.length ) {

            const first = results[ 0 ];

            if ( 'a' in first && 'b' in first && 'res' in first ) return results as MetricResultSingle<R>[];

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
    protected rebuild (
        results: MetricResultSingle<R>[],
        sourceData: T[],
        removeZero?: boolean,
        objectsOnly?: boolean
    ) : any {

        const output = results.reduce( ( acc, result, i ) => {

            if ( removeZero && result.res === 0 ) return acc;

            const item: any = { obj: sourceData[ i ], key: this.key, result: {
                source: result.a, target: result.b, match: result.res
            } };

            if ( result.raw ) item.raw = result.raw;

            acc.push( objectsOnly ? item.obj : item );

            return acc;

        }, [] as any );

        return output;

    }

    /**
     * Sorts results in-place by match score.
     * 
     * @param {any[]} results - The results to sort
     * @param {string|boolean} [sort] - Sort direction (asc, desc, or boolean true=desc)
     * @returns {any[]} - Sorted results
     */
    protected sort ( results: any[], sort?: string | boolean ) : any[] {

        if ( !sort || results.length <= 1 ) return results;

        const isAsc = sort === 'asc';
        const getMatch = ( item: any ) => item.match !== undefined ? item.match : item.result?.match ?? 0;

        return results.sort( ( a, b ) => {

            const aMatch = getMatch( a );
            const bMatch = getMatch( b );

            return isAsc ? aMatch - bMatch : bMatch - aMatch;

        } );

    }

}
