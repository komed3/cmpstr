/**
 * Hamming Distance
 * CmpStr module
 * 
 * The Hamming distance between two equal-length strings of symbols is the
 * number of positions at which the corresponding symbols are different.
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

    if ( a.length !== b.length ) {

        /* strings must be of equal length for this calculation */

        throw new Error ( 'strings must be of equal length for Hamming Distance' );

    }

    return 1 - (
        [ ...a ].reduce(
            ( sum, char, i ) => sum + ( char !== b[ i ] ? 1 : 0 ),
            0
        ) /
        a.length
    );

};