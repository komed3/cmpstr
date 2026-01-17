import type { MetricRaw, MetricResultSingle } from './Types';

export class StructuredData<T = any, R = MetricRaw> {

    public static create<T = any, R = MetricRaw> (
        data: T[], key: string | number | symbol
    ) : StructuredData<T, R> {

        return new StructuredData ( data, key );

    }

    protected data: T[];
    protected key: string | number | symbol;

    protected constructor ( data: T[], key: string | number | symbol ) {

        this.data = data;
        this.key = key;

    }

    protected extractFrom ( arr: T[], key: string | number | symbol ) : string[] {

        return arr.map( item => String ( ( item as any )[ key ] ?? '' ) );

    }

    protected extract () : string[] {

        return this.extractFrom( this.data, this.key );

    }

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
