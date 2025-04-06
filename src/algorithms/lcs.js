/**
 * Longest Common Subsequence (LCS)
 * CmpStr module
 * 
 * LCS measures the length of the longest subsequence common to both strings.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * module exports
 * @public
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @returns {Number} similarity score (0..1)
 */
module.exports = ( a, b ) => {

    if ( a === b ) {

        /* both string are similar or empty */

        return 1;

    } else if ( a.length < 2 || b.length < 2 ) {

        /* for not similar 0- or 1-letter strings */

        return 0;

    } else {

        /* step 1: create matrix */

        let matrix = Array( a.length + 1 ).fill( null ).map(
            () => Array( b.length + 1 ).fill( 0 )
        );

        for ( let i = 1; i <= a.length; i++ ) {

            for ( let j = 1; j <= b.length; j++ ) {

                if ( a[ i - 1 ] === b[ j - 1 ] ) {

                    matrix[ i ][ j ] = matrix[ i - 1 ][ j - 1 ] + 1;

                } else {

                    matrix[ i ][ j ] = Math.max(
                        matrix[ i - 1 ][ j ],
                        matrix[ i ][ j - 1 ]
                    );

                }

            }

        }

        /* step 2: calculate LCS */

        return (
            matrix[ a.length ][ b.length ] /
            Math.max( a.length, b.length )
        );

    }

};