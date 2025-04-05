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
     * @param {String} [flags=''] normalization flags
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Promise} Promise resolving similarity between a and b
     */
    compareAsync ( algo, a, b, flags = '', ...args ) {

        return new Promise ( ( resolve, reject ) => {

            setImmediate( () => {

                try {

                    resolve( this.compare(
                        algo, a, b, flags, ...args
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
     * @param {String} [flags=''] normalization flags
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Promise} Promise resolving similarity to base string
     */
    testAsync ( str, flags = '', ...args ) {

        if ( this.isReady() ) {

            return new Promise ( ( resolve, reject ) => {

                setImmediate( () => {

                    try {

                        resolve( this.test(
                            str, flags, ...args
                        ) );

                    } catch ( err ) {

                        reject( err );

                    }

                } );

            } );

        }

    };

    /**
     * tests the similarity of multiple strings against the base string
     * 
     * @async
     * 
     * @param {String[]} arr array of strings
     * @param {String} [flags=''] normalization flags
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Promise} Promise resolving an array of objects, each containing target string and similarity score
     */
    batchTestAsync ( arr, flags = '', ...args ) {

        if ( this.isReady() ) {

            let tasks = [ ...arr ].map( ( str ) => {

                return new Promise ( ( resolve, reject ) => {

                    setImmediate( () => {

                        try {

                            resolve( {
                                target: str,
                                match: this.test(
                                    str, flags, ...args
                                )
                            } );

                        } catch ( err ) {

                            reject( err );

                        }

                    } );

                } );

            } );

            return Promise.all( tasks );

        }

    };

    /**
     * finds strings in an array that exceed a similarity threshold
     * returns the array sorted by highest similarity
     * 
     * @async
     * 
     * @param {String[]} arr array of strings
     * @param {String} [flags=''] normalization flags
     * @param {Number} [threshold=0] minimum similarity score to consider a match
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Promise} Promise resolving an array of objects, sorted by highest similarity
     */
    async matchAsync ( arr, flags = '', threshold = 0, ...args ) {

        if ( this.isReady() ) {

            let res = await this.batchTestAsync(
                arr, flags, ...args
            );

            return res.filter(
                ( r ) => r.match >= threshold
            ).sort(
                ( a, b ) => b.match - a.match
            );

        }

    };

    /**
     * finds the closest matching string from an array
     * 
     * @async
     * 
     * @param {String[]} arr array of strings
     * @param {String} [flags=''] normalization flags
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Promise} Promise resolving the closest matching string
     */
    async closestAsync ( arr, flags = '', ...args ) {

        if ( this.isReady() ) {

            let res = await this.matchAsync(
                arr, flags, 0, ...args
            );

            return res.length
                ? res[0].target
                : undefined;

        }

    };

    /**
     * generate a similarity matrix for an array of strings
     * 
     * @async
     * 
     * @param {String} algo name of the algorithm
     * @param {String[]} arr array of strings to cross-compare
     * @param {String} [flags=''] normalization flags
     * @param {...any} args additional arguments to pass to the algorithm
     * @returns {Promise} Promise resolving an 2D array representing the similarity matrix
     */
    similarityMatrixAsync ( algo, arr, flags = '', ...args ) {

        if ( this.loadAlgo( algo ) ) {

            let tasks = [ ...arr ].map( ( a, i ) => {

                return Promise.all( [ ...arr ].map( ( b, j ) => {

                    return new Promise ( ( resolve, reject ) => {

                        setImmediate( () => {

                            try {

                                resolve( i === j ? 1 : this.compare(
                                    algo, a, b, flags, ...args
                                ) );

                            } catch ( err ) {

                                reject( err );

                            }

                        } );

                    } );

                } ) );

            } );

            return Promise.all( tasks );

        }

    };

};