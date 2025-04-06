/**
 * Smith-Waterman Algorithm
 * CmpStr module
 * 
 * The Smith-Waterman algorithm performs local alignment, finding the
 * best matching subsequence between two strings. It is commonly used
 * in bioinformatics.
 * 
 * @author Paul Köhler
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
 *   @param {Number} [match=2] score for a match
 *   @param {Number} [mismatch=-1] penalty for a mismatch
 *   @param {Number} [gap=-1] penalty for a gap
 * }
 * @returns {Number} similarity score (0..1)
 */

module.exports = ( a, b, {
    match = 2, mismatch = -1, gap = -1
} = {} ) => {

    let rows = a.length + 1,
        cols = b.length + 1;

    /* step 1: initialize scoring matrix */

    let matrix = Array.from(
        { length: rows },
        () => Array( cols ).fill( 0 )
    );

    /* step 2: fill the scoring matrix */

    let maxScore = 0;

    for ( let i = 1; i < rows; i++ ) {

        for ( let j = 1; j < cols; j++ ) {

            let matchScore = a[ i - 1 ] === b[ j - 1 ] ? match : mismatch;

            matrix[ i ][ j ] = Math.max(
                0,
                matrix[ i - 1 ][ j - 1 ] + matchScore,
                matrix[ i - 1 ][ j ] + gap,
                matrix[ i ][ j - 1 ] + gap
            );

            maxScore = Math.max(
                maxScore,
                matrix[ i ][ j ]
            );

        }

    }

    /* step 3: normalize the score to a value between 0..1 */

    return Math.max( 0, Math.min( 1,
        maxScore / Math.min(
            a.length * match,
            b.length * match
        )
    ) );

};