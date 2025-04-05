/**
 * CmpStr
 * 
 * This lightweight npm package can be used to calculate the similarity of strings,
 * find best matches in arrays and much more. The package supports a number of built-in
 * algorithms, e.g. Levenshtein distance and Dice-Sørensen coefficient. Additional
 * custom algorithms can be added.
 * 
 * @author komed3 (Paul Köhler)
 * @version 2.0.0
 * @license MIT
 */

'use strict';

module.exports = class CmpStr {

    /**
     * private object with all defined similarity algorithms
     * 
     * @private
     * @type {Object}
     */
    #register = {
        levenshtein: require( './algorithms/levenshtein' ),
        dice: require( './algorithms/dice' )
    };

    /**
     * current algorithm to use for similarity calculations
     * set by setAlgo(), addAlgo() or constructor()
     * 
     * @type {String}
     */
    algo;

    /**
     * base string for comparison
     * set by setStr or constructor()
     * 
     * @type {String}
     */
    str;

    /**
     * initializes a CmpStr instance
     * algorithm and base string can be set by initialization
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @param {String} str string to set as the base
     */
    constructor ( algo = undefined, str = undefined ) {

        if ( algo !== undefined ) {

            this.setAlgo( algo );

        }

        if ( str != undefined ) {

            this.setStr( str );

        }

    };

    /**
     * checks whether string and algorithm are set correctly
     * 
     * @returns {Boolean} is ready state
     */
    isReady () {

        return (
            typeof this.algo === 'string' &&
            this.isAlgo( this.algo ) &&
            typeof this.str === 'string' &&
            this.str.length
        );

    };

    /**
     * checks if an algorithm is registered
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @returns {Boolean} true if the algorithm is registered, false otherwise
     */
    isAlgo ( algo ) {

        return algo in this.#register;

    };

    /**
     * adds a new similarity algorithm to the class
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @param {Function} callback function implementing the algorithm (must accept two strings and return a number)
     * @param {Boolean} [useIt=true] whether to set this algorithm as the current one
     * @returns {Boolean} returns true if the algorithms was added successfully
     * @throws {Error} if the algorithm cannot be added
     */
    addAlgo ( algo, callback, useIt = true ) {

        if (
            !this.isAlgo( algo ) &&
            typeof callback === 'function' &&
            callback.length == 2 &&
            typeof callback.apply( null, [ 'abc', 'abc' ] ) === 'number'
        ) {

            this.#register[ algo ] = callback;

            if ( useIt ) {

                this.setAlgo( algo );

            }

            return true;

        } else {

            throw new Error( 'the algorithm could not be added' );

        }

    };

    /**
     * sets the current algorithm to use for similarity calculations
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @returns {Boolean} true if the algorithm has been set
     * @throws {Error} if the algorithm is not defined
     */
    setAlgo ( algo ) {

        if ( this.isAlgo( algo ) ) {

            this.algo = algo;

            return true;

        } else {

            throw new Error( algo + ' is not defined' );

        }

    };

    /**
     * sets the base string for comparison
     * 
     * @param {String} str string to set as the base
     * @returns {Boolean} always returns true
     */
    setStr ( str ) {

        this.str = String( str );

        return true;

    };

    /**
     * tests the similarity between the base string and a target string using the current algorithm
     * 
     * @param {String} str target string to compare
     * @returns {Number} similarity score between 0 and 1
     */
    test ( str ) {

        if ( this.isReady() ) {

            return this.#register[ this.algo ].apply(
                null, [ this.str, String( str ) ]
            );

        }

    };

    /**
     * tests the similarity of multiple strings against the base string
     * 
     * @param {String[]} arr array of strings to compare
     * @returns {Object[]} array of objects, each containing the target string and its similarity score
     */
    batchTest ( arr ) {

        if ( this.isReady() ) {

            return [ ...arr ].map( ( str ) => ( {
                target: str,
                match: this.test( str )
            } ) );

        }

    };

    /**
     * finds all strings in an array that exceed a similarity threshold
     * returns the array sorted by highest similarity
     * 
     * @param {String[]} arr array of strings to compare
     * @param {Number} [threshold=0] minimum similarity score to consider a match
     * @returns {Object[]} array of objects, each containing the target string and its similarity score
     */
    match ( arr, threshold = 0 ) {

        if ( this.isReady() ) {

            return this.batchTest( arr ).filter(
                ( r ) => r.match >= threshold
            ).sort(
                ( a, b ) => b.match - a.match
            );

        }

    };

    /**
     * finds the closest matching string from an array of strings
     * 
     * @param {String[]} arr array of strings to compare
     * @returns {String} closest matching string
     */
    closest ( arr ) {

        if ( this.isReady() ) {

            return this.match( arr )[ 0 ].target;

        }

    };

    /**
     * generate a similarity matrix for an array of strings
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @param {String[]} arr array of strings to compare
     * @returns {Number[][]} 2D array representing the similarity matrix
     */
    similarityMatrix ( algo, arr ) {

        if ( this.setAlgo( algo ) ) {

            return [ ...arr ].map( ( a, i ) => {

                this.setStr( a );

                return [ ...arr ].map(
                    ( b, j ) => i === j ? null : this.test( b )
                );

            } );

        }

    };

};