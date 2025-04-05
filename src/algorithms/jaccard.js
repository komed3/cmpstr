'use strict';

/**
 * calculate Jaccard index between two given strings as
 * percentage value between 0 and 1
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @returns {Number} Jaccard index as value between 0 and 1
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
         * for all other strings calculate Jaccard index as
         * percentage value between 0 and 1
         */

        let setA = new Set( a ),
            setB = new Set( b );

        return (
            new Set( [ ...setA ].filter( x => setB.has( x ) ) )
        ).size / (
            new Set( [ ...setA, ...setB ] )
        ).size;

    }

};