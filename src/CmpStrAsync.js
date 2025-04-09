/**
 * class CmpStrAsync
 * extends CmpStr
 * 
 * The CmpStrAsync class extends the CmpStr class and provides asynchronous
 * versions of its methods. It uses Promises and setImmediate to ensure
 * non-blocking execution, making it suitable for use in asynchronous workflows.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * module dependencies
 * @private
 */

const CmpStr = require( './CmpStr' );

/**
 * module exports
 * @public
 */

module.exports = class CmpStrAsync extends CmpStr {

    /**
     * initializes a CmpStrAsync instance
     * algorithm and base string can be set by initialization
     * 
     * @param {String} algo name of the algorithm to use for calculation
     * @param {String} str string to set as the base
     */
    constructor ( algo = undefined, str = undefined ) {

        super ( algo, str );

    };

    /**
     * generic async wrapper for methods
     * 
     * @private
     * @param {Function} method method to call
     * @param {...any} args arguments to pass to the method
     * @returns {Promise} Promise resolving the result of the method
     */
    #asyncWrapper ( method, ...args ) {

        return new Promise ( ( resolve, reject ) => {

            setImmediate( () => {

                try {

                    resolve( method.apply( this, args ) );

                } catch ( err ) {

                    reject( err );

                }

            } );

        } );

    };

    /**
     * --------------------------------------------------
     * Asynchronous Methods
     * --------------------------------------------------
     */

    /**
     * normalizes a string by chainable options; uses cache to increase
     * performance and custom filters for advanced behavior
     * 
     * @since 2.0.2
     * @param {String|String[]} input string(s) to normalize
     * @param {String} [flags=''] normalization flags
     * @returns {Promise} Promise resolving string normalization
     */
    normalizeAsync ( input, flags = '' ) {

        return this.#asyncWrapper(
            this.normalize,
            input, flags
        );

    };

    /**
     * compares two string a and b using the passed algorithm
     * 
     * @param {String} algo name of the algorithm
     * @param {String} a string a
     * @param {String} b string b
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving similarity between a and b
     */
    compareAsync ( algo, a, b, config = {} ) {

        return this.#asyncWrapper(
            this.compare,
            algo, a, b, config
        );

    };

    /**
     * tests the similarity between the base string and a target string
     * using the current algorithm
     * 
     * @param {String} str target string
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving similarity to base string
     */
    testAsync ( str, config = {} ) {

        return this.#asyncWrapper(
            this.test,
            str, config
        );

    };

    /**
     * tests the similarity of multiple strings against the base string
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving an array of objects, each containing target string and similarity score
     */
    batchTestAsync ( arr, config = {} ) {

        return this.#asyncWrapper(
            this.batchTest,
            arr, config
        );

    };

    /**
     * finds strings in an array that exceed a similarity threshold
     * returns the array sorted by highest similarity
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, threshold, args)
     * @returns {Promise} Promise resolving an array of objects, sorted by highest similarity
     */
    matchAsync ( arr, config = {} ) {

        return this.#asyncWrapper(
            this.match,
            arr, config
        );

    };

    /**
     * finds the closest matching string from an array
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving the closest matching string
     */
    closestAsync ( arr, config = {} ) {

        return this.#asyncWrapper(
            this.closest,
            arr, config
        );

    };

    /**
     * generate a similarity matrix for an array of strings
     * 
     * @param {String} algo name of the algorithm
     * @param {String[]} arr array of strings to cross-compare
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving an 2D array representing the similarity matrix
     */
    similarityMatrixAsync ( algo, arr, config = {} ) {

        return this.#asyncWrapper(
            this.similarityMatrix,
            algo, arr, config
        );

    };

};