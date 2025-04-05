'use strict';

/**
 * calculate Dice-Sørensen coefficient between two given strings as
 * percentage value between 0 and 1
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @returns {Number} Dice-Sørensen coefficient as value between 0 and 1
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