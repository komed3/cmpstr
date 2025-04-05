'use strict';

/**
 * Jaccard Index
 * 
 * The Jaccard Index measures the similarity between two sets by dividing
 * the size of their intersection by the size of their union.
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
         * for all other strings calculate Jaccard Index
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