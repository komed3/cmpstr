'use strict';

/**
 * Levenshtein Distance
 * 
 * The Levenshtein distance between two strings is the minimum number of
 * single-character edits (i.e. insertions, deletions or substitutions)
 * required to change one word into the other.
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
         * for all other strings calculate Levenshtein distance as
         * percentage value between 0 and 1
         */

        /* step 1: create matrix */

        let matrix = [];

        for ( let i = 0; i <= a.length; i++ ) {

            let row = [];

            for ( let j = 0; j <= b.length; j++ ) {

                row.push( j );

            }

            row[ 0 ] = i;

            matrix.push( row );

        }

        /* step 2: calculate distance */

        for ( let i = 1; i <= a.length; i++ ) {

            for ( let j = 1; j <= b.length; j++ ) {

                if ( a[ i - 1 ] === b[ j - 1 ] ) {

                    matrix[ i ][ j ] = matrix[ i - 1 ][ j - 1 ];

                } else {

                    matrix[ i ][ j ] = 1 + Math.min(
                        matrix[ i ][ j - 1 ],
                        matrix[ i - 1 ][ j - 1 ], 
                        matrix[ i - 1 ][ j ]
                    );

                }

            }

        }

        /* step 3: get levenshtein distance as percentage */

        return 1 - (
            matrix[ a.length ][ b.length ] /
            Math.max( a.length, b.length )
        );

    }

};