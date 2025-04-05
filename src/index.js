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
    #algorithms = {
        cosine: './algorithms/cosine',
        dice: './algorithms/dice',
        hamming: './algorithms/hamming',
        jaccard: './algorithms/jaccard',
        jaro: './algorithms/jaroWinkler',
        lcs: './algorithms/lcs',
        levenshtein: './algorithms/levenshtein'
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
            this.str.length != 0
        );

    };

    /**
     * checks if an algorithm is registered
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @returns {Boolean} true if the algorithm is registered, false otherwise
     */
    isAlgo ( algo ) {

        return algo in this.#algorithms;

    };

    /**
     * list all registered similarity algorithms
     * 
     * @returns {String[]} array of registered algorithms
     */
    listAlgo () {

        return Object.keys( this.#algorithms );

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
            callback.length >= 2 &&
            typeof callback.apply( null, [ 'abc', 'abc' ] ) === 'number'
        ) {

            this.#algorithms[ algo ] = callback;

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

            if ( typeof this.#algorithms[ algo ] === 'string' ) {

                /* lazy load modules */

                this.#algorithms[ algo ] = require( this.#algorithms[ algo ] );

            }

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
     * @private
     * normalize a string
     * 
     * @param {String} string to normalize
     * @param {String} [flags=''] flags for normalization
     * - case insensitivity (i)
     * - trim whitespaces (t)
     * - remove special chars (s)
     * - normalize unicode (u)
     * - ignore numbers (n)
     * - collapse whitespaces (w)
     * @returns {String} normalized string
     */
    #normalize ( str, flags = '' ) {

        return [ ...flags ].reduce( ( res, flag ) => {

            switch ( flag ) {

                case 'i':
                    return res.toLowerCase();

                case 't':
                    return res.trim();

                case 's':
                    return res.replace( /[^a-z0-9]/gi, '' );

                case 'u':
                    return res.normalize( 'NFC' );

                case 'n':
                    return res.replace( /[0-9]/g, '' );

                case 'w':
                    return res.replace( /\s+/g, ' ' );

                default:
                    return res;

            }

        }, String( str ) );

    };

    /**
     * tests the similarity between the base string and a target string using the current algorithm
     * 
     * @param {String} str target string to compare
     * @param {String} [flags=''] flags for normalization
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Number} similarity score between 0 and 1
     */
    test ( str, flags = '', ...args ) {

        if ( this.isReady() ) {

            return this.#algorithms[ this.algo ].apply( null, [
                this.#normalize( this.str, flags ),
                this.#normalize( String( str ), flags ),
                ...args
            ] );

        }

    };

    /**
     * tests the similarity of multiple strings against the base string
     * 
     * @param {String[]} arr array of strings to compare
     * @param {String} [flags=''] flags for normalization
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Object[]} array of objects, each containing the target string and its similarity score
     */
    batchTest ( arr, flags = '', ...args ) {

        if ( this.isReady() ) {

            return [ ...arr ].map( ( str ) => ( {
                target: str,
                match: this.test( str, flags, ...args )
            } ) );

        }

    };

    /**
     * finds all strings in an array that exceed a similarity threshold
     * returns the array sorted by highest similarity
     * 
     * @param {String[]} arr array of strings to compare
     * @param {String} [flags=''] flags for normalization
     * @param {Number} [threshold=0] minimum similarity score to consider a match
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Object[]} array of objects, each containing the target string and its similarity score
     */
    match ( arr, flags = '', threshold = 0, ...args ) {

        if ( this.isReady() ) {

            return this.batchTest( arr, flags, ...args ).filter(
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
     * @param {String} [flags=''] flags for normalization
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {String} closest matching string
     */
    closest ( arr, flags = '', ...args ) {

        if ( this.isReady() ) {

            return this.match( arr, flags, ...args )[ 0 ].target;

        }

    };

    /**
     * generate a similarity matrix for an array of strings
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @param {String[]} arr array of strings to compare
     * @param {String} [flags=''] flags for normalization
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Number[][]} 2D array representing the similarity matrix
     */
    similarityMatrix ( algo, arr, flags = '', ...args ) {

        if ( this.setAlgo( algo ) ) {

            return [ ...arr ].map( ( a, i ) => {

                this.setStr( a );

                return [ ...arr ].map(
                    ( b, j ) => i === j ? null : this.test( b, flags, ...args )
                );

            } );

        }

    };

};