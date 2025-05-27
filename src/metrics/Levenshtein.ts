'use strict';

import type { MetricInput, MetricOptions, MetricResult, MetricResultSingle } from '../utils/Types';
import { Pool } from '../utils/Pool';
import { Perf } from '../utils/Performance';

const _levenshteinDistance = ( a: string, b: string, m: number, n: number ) : number => {

    if ( a === b ) return 0;
    if ( m === 0 ) return n;
    if ( n === 0 ) return m;

    if ( m > n ) [ a, b, m, n ] = [ b, a, n, m ];

    const [ prev, curr ] = Pool.get( m + 1 );

    for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

    for ( let j = 1; j <= n; j++ ) {

        curr[ 0 ] = j;

        const cb: number = b.charCodeAt( j - 1 );

        for ( let i = 1; i <= m; i++ ) {

            const cost: number = a.charCodeAt( i - 1 ) === cb ? 0 : 1;

            curr[ i ] = Math.min(
                curr[ i - 1 ] + 1,
                prev[ i ] + 1,
                prev[ i - 1 ] + cost
            );

        }

        prev.set( curr );

    }

    return prev[ m ];

};

const _single = ( a: string, b: string, perf: Perf | null ) : MetricResultSingle => {

    const m: number = a.length, n: number = b.length;
    const maxLen: number = Math.max( m, n );

    const distance: number = _levenshteinDistance( a, b, m, n );
    const similarity: number = maxLen === 0 ? 1 : 1 - distance / maxLen;

    return {
        metric: 'levenshtein', a, b, similarity, raw: { distance },
        ...( perf ? { perf: perf.get() } : {} )
    };

};

export default (
    a: MetricInput, b: MetricInput,
    options: MetricOptions = {}
) : MetricResult => {

    const perf = options.perf ? new Perf () : null;

    if ( typeof a === 'string' && typeof b === 'string' ) {

        return _single( a, b, perf );

    }

    const results: MetricResultSingle[] = [];
    const A: string[] = Array.isArray( a ) ? a : [ a ];
    const B: string[] = Array.isArray( b ) ? b : [ b ];

    for ( let i = 0; i < A.length; i++ ) {

        const s: string = A[ i ];

        for ( let j = 0; j < B.length; j++ ) {

            results.push( _single( s, B[ j ], perf ) );

        }

    }

    return results;

};