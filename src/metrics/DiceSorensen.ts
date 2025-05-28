'use strict';

import type { MetricInput, MetricOptions, MetricResult, MetricResultSingle } from '../utils/Types';
import { Helper } from '../utils/Helper';
import { Perf } from '../utils/Performance';

const _getBigrams = ( str: string ) : Set<string> => {

    const bigrams: Set<string> = new Set ();

    for ( let i = 0; i < str.length - 1; i++ ) {

        bigrams.add( str.substring( i, i + 2 ) );

    }

    return bigrams;

};

const _diceSorensen = ( a: string, b: string, m: number, n: number ) : number => {

    if ( a === b ) return 1;
    if ( m < 2 || n < 2 ) return 0;

    if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

    const setA: Set<string> = _getBigrams( a );
    const setB: Set<string> = _getBigrams( b );

    let intersection: number = 0;

    for ( const bigram of setA ) {

        if ( setB.has( bigram ) ) intersection++;

    }

    const total: number = setA.size + setB.size;

    return total === 0 ? 1 : ( 2 * intersection ) / total;

};

const _computeSingleResult = ( a: string, b: string, perf: Perf | null ) : MetricResultSingle => {

    const { m, n } = Helper.mnLen( a, b );

    const similarity: number = _diceSorensen( a, b, m, n );

    return {
        metric: 'dice', a, b, similarity, raw: {},
        ...( perf ? { perf: perf.get() } : {} )
    };

};

export default (
    a: MetricInput, b: MetricInput,
    options: MetricOptions = {}
) : MetricResult => {

    const perf = options.perf ? new Perf () : null;

    if ( Helper.singleOp( a, b ) ) {

        return _computeSingleResult( a as string, b as string, perf );

    }

    const results: MetricResultSingle[] = [];
    const A: string[] = Helper.asArr( a );
    const B: string[] = Helper.asArr( b );

    for ( let i = 0; i < A.length; i++ ) {

        const s: string = A[ i ];

        for ( let j = 0; j < B.length; j++ ) {

            results.push( _computeSingleResult( s, B[ j ], perf ) );

        }

    }

    return results;

};