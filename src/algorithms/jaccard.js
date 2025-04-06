/**
 * Jaccard Index
 * CmpStr module
 * 
 * The Jaccard Index measures the similarity between two sets by dividing
 * the size of their intersection by the size of their union.
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

    let setA = new Set ( a ),
        setB = new Set ( b );

    return (
        new Set ( [ ...setA ].filter( x => setB.has( x ) ) )
    ).size / (
        new Set ( [ ...setA, ...setB ] )
    ).size;

};