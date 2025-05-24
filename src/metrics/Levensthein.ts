'use strict';

import type { MetricResult } from '../utils/Types.js';

export default (
    a : string,
    b : string
) : MetricResult => {

    /** Use always the shorter string as columns (save memory) */
    [ a, b ] = a.length > b.length ? [ b, a ] : [ a, b ];

    const m = a.length;
    const n = b.length;
    const maxLen = Math.max( m, n );

    let prev = new Array ( m + 1 );
    let curr = new Array ( m + 1 );

    /** Initialization of the first line */
    for ( let i = 0; i <= m; i++ ) prev[ i ] = i;

    /** Loop through the characters of the second string */
    for ( let j = 1; j <= n; j++ ) {

        curr[ 0 ] = j;

        for ( let i = 1; i <= m; i++ ) {

            const cost = a[ i - 1 ] === b[ j - 1 ] ? 0 : 1;

            curr[ i ] = Math.min(
                curr[ i - 1 ] + 1,    // insert
                prev[ i ] + 1,        // delete
                prev[ i - 1 ] + cost  // replace
            );

        }

        /** Swap the lines */
        [ prev, curr ] = [ curr, prev ];

    }

    /** Calculate string similarity */
    const res = maxLen === 0 ? 1 : 1 - prev[ m ] / maxLen;

    /** Return the result */
    return {
        metric: 'levensthein', a, b,
        raw: prev[ m ], res
    };

};