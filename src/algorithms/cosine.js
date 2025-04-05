'use strict';

/**
 * Cosine Similarity
 * 
 * Cosine similarity measures the cosine of the angle between two vectors,
 * often used for text similarity.
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @param {String} [delimiter=" "] term delimiter
 * @returns {Number} similarity (0..1)
 */
module.exports = ( a, b, delimiter = ' ' ) => {

    if ( a === b ) {

        /* both string are similar or empty */

        return 1;

    } else if ( a.length < 2 || b.length < 2 ) {

        /* for not similar 0- or 1-letter strings */

        return 0;

    } else {

        /**
         * for all other strings calculate Cosine similarity
         */

        /**
         * get term frequency from string
         * 
         * @param {String} str string
         * @returns {Object} term frequency
         */
        const termFreq = ( str ) => {

            let freq = {};

            str.split( delimiter ).forEach( ( term ) => {

                freq[ term ] = ( freq[ term ] || 0 ) + 1;

            } );

            return freq;

        };

        /* step 1: count the frequency of chars per string */

        let termsA = termFreq( a ),
            termsB = termFreq( b );

        let allTerms = new Set( [
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