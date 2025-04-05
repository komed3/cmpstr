'use strict';

/**
 * Longest Common Subsequence (LCS)
 * 
 * LCS measures the length of the longest subsequence common to both strings.
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @returns {Number} similarity (0..1)
 */
module.exports = ( a, b ) => {

    if ( a === b ) {

        /* both string are similar or empty */

        return 1;

    } else if ( a.length < 2 || b.length < 2 ) {

        /* for not similar 0- or 1-letter strings */

        return 0;

    } else {

        /**
         * for all other strings calculate LCS
         */

        let dp = Array( a.length + 1 ).fill( null ).map(
            () => Array( b.length + 1 ).fill( 0 )
        );

        for ( let i = 1; i <= a.length; i++ ) {

            for ( let j = 1; j <= b.length; j++ ) {

                if ( a[ i - 1 ] === b[ j - 1 ] ) {

                    dp[ i ][ j ] = dp[ i - 1 ][ j - 1 ] + 1;

                } else {

                    dp[ i ][ j ] = Math.max(
                        dp[ i - 1 ][ j ],
                        dp[ i ][ j - 1 ]
                    );

                }

            }

        }

        return (
            dp[ a.length ][ b.length ] /
            Math.max( a.length, b.length )
        );

    }

};