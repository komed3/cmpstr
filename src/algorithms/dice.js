/**
 * Dice-Sørensen Coefficient
 * CmpStr module
 * 
 * The Sørensen index equals twice the number of elements common to both sets
 * divided by the sum of the number of elements in each set. Equivalently,
 * the index is the size of the intersection as a fraction of the average
 * size of the two sets.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * private helper function
 * get bigrams from string
 * @private
 * 
 * @param {String} str string
 * @returns {Set} set of bigrams
 */
const _str2bigrams = ( str ) => {

    let bigrams = new Set ();

    for ( let i = 0; i < str.length - 1; i++ ) {

        bigrams.add( str.substring( i, i + 2 ) );

    }

    return bigrams;

};

/**
 * module exports
 * @public
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @returns {Number} similarity score (0..1)
 */

module.exports = ( a, b ) => {

    /* step 1: generate bigrams from strings */

    let setA = _str2bigrams( a ),
        setB = _str2bigrams( b );

    /* step 2: calculate coefficient */

    return (
        ( new Set ( [ ...setA ].filter( ( test ) => {
            return setB.has( test );
        } ) ) ).size * 2
    ) / (
        setA.size +
        setB.size
    );

};