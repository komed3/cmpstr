/**
 * q-Gram Similarity
 * CmpStr module
 * 
 * Q-gram similarity is a string-matching algorithm that compares two
 * strings by breaking them into substrings of length Q. It's used to
 * determine how similar the two strings are.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * private helper function
 * convert string to array of substrings
 * @private
 * 
 * @param {String} str string
 * @param {Int} q length of substrings
 * @returns {String[]} array of substrings
 */

const _qGrams = ( str, q ) => {

    let grams = [];

    for ( let i = 0; i <= str.length - q; i++ ) {

        grams.push( str.slice( i, i + q ) );

    }

    return grams;

};

/**
 * module exports
 * @public
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @param {Object} options having {
 *   @param {Int} [q=2] length of substrings
 * }
 * @returns {Number} similarity score (0..1)
 */
module.exports = ( a, b, { q = 2 } = {} ) => {

    let setA = new Set ( _qGrams( a, q ) ),
        setB = new Set ( _qGrams( b, q ) );

    return (
        new Set( [ ...setA ].filter(
            test => setB.has( test )
        ) )
    ).size / Math.max(
        setA.size, setB.size
    );

};