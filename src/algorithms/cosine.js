/**
 * Cosine Similarity
 * CmpStr module
 * 
 * Cosine similarity is a measure how similar two vectors are. It's often used
 * in text analysis to compare texts based on the words they contain.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * private helper function
 * get term frequency from string
 * @private
 * 
 * @param {String} str string
 * @param {String} delimiter term delimiter
 * @returns {Object} term frequency
 */
const _termFreq = ( str, delimiter ) => {

    let freq = {};

    str.split( delimiter ).forEach( ( term ) => {

        freq[ term ] = ( freq[ term ] || 0 ) + 1;

    } );

    return freq;

};

/**
 * module exports
 * @public
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @param {Object} options having {
 *   @param {String} [delimiter=' '] term delimiter
 * }
 * @returns {Number} similarity score (0..1)
 */
module.exports = ( a, b, { delimiter = ' ' } = {} ) => {

    if ( a === b ) {

        /* both string are similar or empty */

        return 1;

    } else if ( a.length < 2 || b.length < 2 ) {

        /* for not similar 0- or 1-letter strings */

        return 0;

    } else {

        /* step 1: count the frequency of chars per string */

        let termsA = _termFreq( a, delimiter ),
            termsB = _termFreq( b, delimiter );

        let allTerms = new Set ( [
            ...Object.keys( termsA ),
            ...Object.keys( termsB )
        ] );

        /* step 2: calculate the dot product */

        let dotProduct = [ ...allTerms ].reduce(
            ( sum, char ) => sum + ( termsA[ char ] || 0 ) * ( termsB[ char ] || 0 ),
            0
        );

        /* step 3: calculate the vector magnitudes */

        let magnitudeA = Math.sqrt( [ ...allTerms ].reduce(
            ( sum, char ) => sum + ( termsA[ char ] || 0 ) ** 2,
            0
        ) );

        let magnitudeB = Math.sqrt( [ ...allTerms ].reduce(
            ( sum, char ) => sum + ( termsB[ char ] || 0 ) ** 2,
            0
        ) );

        /* step 4: calculate Cosine similarity */

        return magnitudeA && magnitudeB
            ? dotProduct / ( magnitudeA * magnitudeB )
            : 0;

    }

};