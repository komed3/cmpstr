'use strict';

/**
 * Dice-Sørensen Coefficient
 * 
 * The Sørensen index equals twice the number of elements common to both sets
 * divided by the sum of the number of elements in each set. Equivalently,
 * the index is the size of the intersection as a fraction of the average
 * size of the two sets.
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
         * for all other strings calculate Dice-Sørensen coefficient distance
         * as percentage value between 0 and 1
         */

        /**
         * get bigrams from string
         * 
         * @param {String} str string
         * @returns {Set} set of bigrams
         */
        const str2bigrams = ( str ) => {

            let bigrams = new Set();

            for ( let i = 0; i < str.length - 1; i++ ) {

                bigrams.add( str.substring( i, i + 2 ) );

            }

            return bigrams;

        };

        /* step 1: generate bigrams from strings */

        let setA = str2bigrams( a ),
            setB = str2bigrams( b );

        /* step 2: calculate coefficient */

        return (
            ( new Set( [ ...setA ].filter( ( x ) => {
                return setB.has( x );
            } ) ) ).size * 2
        ) / (
            setA.size +
            setB.size
        );

    }

};