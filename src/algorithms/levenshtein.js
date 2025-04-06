/**
 * Levenshtein Distance
 * CmpStr module
 * 
 * The Levenshtein distance between two strings is the minimum number of
 * single-character edits (i.e. insertions, deletions or substitutions)
 * required to change one word into the other.
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
 * @param {Object} options having {
 *   @param {Boolean} [raw=false] if true the raw distance is returned
 * }
 * @returns {Number} similarity score (0..1) or distance
 */

module.exports = ( a, b, { raw = false } = {} ) => {

    /* step 1: initialize scoring matrix */

    let matrix = Array.from(
        { length: a.length + 1 },
        ( _, i ) => Array.from(
            { length: b.length + 1 },
            ( _, j ) => j
        ).fill( i, 0, 1 )
    );

    /* step 2: calculate Levenshtein distance */

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

    /* step 3: get Levenshtein distance as value between 0..1 */

    return raw ? matrix[ a.length ][ b.length ] : 1 - (
        matrix[ a.length ][ b.length ] /
        Math.max( a.length, b.length )
    );

};