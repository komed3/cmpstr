/**
 * Damerau-Levenshtein Distance
 * CmpStr module
 * 
 * The Damerau-Levenshtein distance differs from the classical Levenshtein
 * distance by including transpositions among its allowable operations in
 * addition to the three classical single-character edit operations
 * (insertions, deletions and substitutions). Useful for correcting typos.
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
            ( _, j ) => i && j ? 0 : i || j
        )
    );

    /* step 2: calculate Damerau-Levenshtein distance */

    for ( let i = 1; i <= a.length; i++ ) {

        for ( let j = 1; j <= b.length; j++ ) {

            let cost = a[ i - 1 ] === b[ j - 1 ] ? 0 : 1;

            matrix[ i ][ j ] = Math.min(
                matrix[ i - 1 ][ j ] + 1,
                matrix[ i ][ j - 1 ] + 1,
                matrix[ i - 1 ][ j - 1 ] + cost
            );

            if (
                i > 1 && j > 1 &&
                a[ i - 1 ] === b[ j - 2 ] &&
                a[ i - 2 ] === b[ j - 1 ]
            ) {

                matrix[ i ][ j ] = Math.min(
                    matrix[ i ][ j ],
                    matrix[ i - 2 ][ j - 2 ] + cost
                );

            }

        }

    }

    /* step 3: get Damerau-Levenshtein distance as value between 0..1 */

    return raw ? matrix[ a.length ][ b.length ] : 1 - (
        matrix[ a.length ][ b.length ] /
        Math.max( a.length, b.length )
    );

};