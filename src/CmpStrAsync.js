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
     * compares two string a and b using the passed algorithm
     * 
     * @async
     * 
     * @param {String} algo name of the algorithm
     * @param {String} a string a
     * @param {String} b string b
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving similarity between a and b
     */
    compareAsync ( algo, a, b, config = {} ) {

        return new Promise ( ( resolve, reject ) => {

            setImmediate( () => {

                try {

                    resolve( this.compare(
                        algo, a, b, config
                    ) );

                } catch ( err ) {

                    reject( err );

                }

            } );

        } );

    };

    /**
     * tests the similarity between the base string and a target string
     * using the current algorithm
     * 
     * @async
     * 
     * @param {String} str target string
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving similarity to base string
     */
    testAsync ( str, config = {} ) {

        return new Promise ( ( resolve, reject ) => {

            setImmediate( () => {

                if ( this.isReady() ) {

                    try {

                        resolve( this.test(
                            str, config
                        ) );

                    } catch ( err ) {

                        reject( err );

                    }

                } else {

                    reject( new Error ( 'not ready, set algorithm and base string first' ) );

                }

            } );

        } );

    };

    /**
     * tests the similarity of multiple strings against the base string
     * 
     * @async
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving an array of objects, each containing target string and similarity score
     */
    batchTestAsync ( arr, config = {} ) {

        if ( this.isReady() ) {

            let tasks = [ ...arr ].map( ( str ) => {

                return new Promise ( ( resolve, reject ) => {

                    setImmediate( () => {

                        try {

                            resolve( {
                                target: str,
                                match: this.test(
                                    str, config
                                )
                            } );

                        } catch ( err ) {

                            reject( err );

                        }

                    } );

                } );

            } );

            return Promise.all( tasks );

        } else {

            return Promise.reject(
                new Error ( 'not ready, set algorithm and base string first' )
            );

        }

    };

    /**
     * finds strings in an array that exceed a similarity threshold
     * returns the array sorted by highest similarity
     * 
     * @async
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, threshold, args)
     * @returns {Promise} Promise resolving an array of objects, sorted by highest similarity
     */
    async matchAsync ( arr, config = {} ) {

        const { threshold = 0 } = config;

        delete config?.options?.raw;

        let res = await this.batchTestAsync(
            arr, config
        );

        return res.filter(
            ( r ) => r.match >= threshold
        ).sort(
            ( a, b ) => b.match - a.match
        );

    };

    /**
     * finds the closest matching string from an array
     * 
     * @async
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving the closest matching string
     */
    async closestAsync ( arr, config = {} ) {

        let res = await this.matchAsync(
            arr, config
        );

        return res.length && res[ 0 ].match > 0
            ? res[ 0 ].target
            : undefined;

    };

    /**
     * generate a similarity matrix for an array of strings
     * 
     * @async
     * 
     * @param {String} algo name of the algorithm
     * @param {String[]} arr array of strings to cross-compare
     * @param {Object} [config={}] config (flags, args)
     * @returns {Promise} Promise resolving an 2D array representing the similarity matrix
     */
    similarityMatrixAsync ( algo, arr, config = {} ) {

        if ( this.loadAlgo( algo ) ) {

            delete config?.options?.raw;

            let tasks = [ ...arr ].map( ( a, i ) => {

                return Promise.all( [ ...arr ].map( ( b, j ) => {

                    return new Promise ( ( resolve, reject ) => {

                        setImmediate( () => {

                            try {

                                resolve( i === j ? 1 : this.compare(
                                    algo, a, b, config
                                ) );

                            } catch ( err ) {

                                reject( err );

                            }

                        } );

                    } );

                } ) );

            } );

            return Promise.all( tasks );

        } else {

            return Promise.reject(
                new Error ( algo + ' cannot be loaded' )
            );

        }

    };

};