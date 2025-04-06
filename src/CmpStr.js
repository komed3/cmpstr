/**
 * class CmpStr
 * 
 * The CmpStr class is the core of the cmpstr package. It provides methods to calculate
 * string similarity, find the closest matches in arrays, and generate similarity
 * matrices. The class supports built-in algorithms (e.g., Levenshtein, Dice-Sørensen)
 * and allows users to add custom algorithms. It also includes features like string
 * normalization, caching, and extensibility.
 * 
 * @author komed3 (Paul Köhler)
 * @license MIT
 */

'use strict';

/**
 * module exports
 * @public
 */

module.exports = class CmpStr {

    /**
     * all pre-defined similarity algorithms
     * 
     * @private
     * @type {Object}
     */
    #algorithms = {
        cosine: './algorithms/cosine',
        damerau: './algorithms/damerau',
        dice: './algorithms/dice',
        hamming: './algorithms/hamming',
        jaccard: './algorithms/jaccard',
        jaro: './algorithms/jaroWinkler',
        lcs: './algorithms/lcs',
        levenshtein: './algorithms/levenshtein',
        needlemanWunsch: './algorithms/needlemanWunsch',
        qGram: './algorithms/qGram',
        smithWaterman: './algorithms/smithWaterman',
        soundex: './algorithms/soundex'
    };

    /**
     * normalized strings cache
     * 
     * @private
     * @type {Map<String, String>}
     */
    #cache = new Map ();

    /**
     * added filters for string normalization
     * 
     * @private
     * @type {Map<Function, Function>}
     */
    #filter = new Map ();

    /**
     * default normalization flags
     * set by setFlags()
     * 
     * @public
     * @type {String}
     */
    flags = '';

    /**
     * base string for comparison
     * set by setStr or constructor()
     * 
     * @public
     * @type {String}
     */
    str;

    /**
     * current algorithm to use for similarity calculations
     * set by setAlgo(), addAlgo() or constructor()
     * 
     * @public
     * @type {String}
     */
    algo;

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

        if ( str !== undefined ) {

            this.setStr( str );

        }

    };

    /**
     * checks whether string and algorithm are set correctly
     * 
     * @returns {Boolean} true if ready, false otherwise
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
     * sets the base string for comparison
     * 
     * @param {String} str string to set as the base
     * @returns {Boolean} always returns true
     */
    setStr ( str ) {

        this.str = String ( str );

        return true;

    };

    /**
     * lazy-loads the specified algorithm module
     * 
     * @param {String} algo name of the similarity algorithm
     * @returns {Boolean} true if the algorithm is loaded
     * @throws {Error} if the algorithm cannot be loaded or is not defined
     */
    loadAlgo ( algo ) {

        if ( this.isAlgo( algo ) ) {

            let typeOf = typeof this.#algorithms[ algo ];

            if ( typeOf === 'function' ) {

                return true;

            } else if ( typeOf === 'string' ) {

                /* lazy-load algorithm module */

                this.#algorithms[ algo ] = require(
                    this.#algorithms[ algo ]
                );

                return true;

            } else {

                throw new Error ( algo + ' cannot be loaded' );

            }

        } else {

            throw new Error ( algo + ' is not defined' );

        }

    };

    /**
     * list all registered similarity algorithms
     * 
     * @returns {String[]} array of algorithm names
     */
    listAlgo () {

        return Object.keys( this.#algorithms );

    };

    /**
     * checks if an algorithm is registered
     * 
     * @param {String} algo name of the algorithm
     * @returns {Boolean} true if the algorithm is registered, false otherwise
     */
    isAlgo ( algo ) {

        return algo in this.#algorithms;

    };

    /**
     * adds a new similarity algorithm
     * 
     * @param {String} algo name of the algorithm
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

            throw new Error ( algo + ' could not be added' );

        }

    };

    /**
     * removes a registered similarity algorithm
     * 
     * @param {String} algo name of the algorithm
     * @returns {Boolean} true if the algorithm was removed successfully
     * @throws {Error} if the algorithm is not defined
     */
    rmvAlgo ( algo ) {

        if ( this.isAlgo( algo ) ) {

            delete this.#algorithms[ algo ];

            if ( this.algo === algo ) {

                /* reset current algorithm if it was removed */

                this.algo = undefined;

            }

            return true;

        } else {

            throw new Error ( algo + ' is not defined' );

        }

    };

    /**
     * sets the current algorithm to use for similarity calculations
     * 
     * @param {String} algo name of the algorithm
     * @returns {Boolean} true if the algorithm has been set
     */
    setAlgo ( algo ) {

        if ( this.loadAlgo( algo ) ) {

            this.algo = algo;

            return true;

        }

    };

    /**
     * add a new string normalization filter
     * 
     * @param {String} ident filter name / identifier
     * @param {Function} callback function implementing the filter (must accept a string and returns a normalized one)
     * @param {Boolean} [clearCache=true] clears the normalization cache if true
     * @returns {Boolean} returns true if the filter was added successfully
     * @throws {Error} if the filter cannot be added
     */
    addFilter ( ident, callback, clearCache = true ) {

        if (
            !this.#filter.has( ident ) &&
            typeof callback === 'function' &&
            callback.length == 1 &&
            typeof callback.apply( null, [ 'abc' ] ) === 'string' &&
            this.#filter.set( ident, callback )
        ) {

            if ( clearCache ) {

                this.clearCache();

            }

            return true;

        } else {

            throw new Error ( 'filter could not be added' );

        }

    };

    /**
     * removes a string normalization filter
     * 
     * @param {String} ident filter name / identifier
     * @param {Boolean} [clearCache=true] clears the normalization cache if true
     * @returns {Boolean} true if the filter was removed successfully
     */
    rmvFilter ( ident, clearCache = true ) {

        if ( clearCache ) {

            this.clearCache();

        }

        return this.#filter.delete( ident );

    };

    /**
     * clears normalization filters (remove all of them)
     * 
     * @param {Boolean} [clearCache=true] clears the normalization cache if true
     * @returns {Boolean} always returns true
     */
    clearFilter ( clearCache = true ) {

        this.#filter.clear();

        if ( clearCache ) {

            this.clearCache();

        }

        return true;

    };

    /**
     * set default normalization flags
     * 
     * @param {String} [flags=''] normalization flags
     * @returns {Boolean} always returns true
     */
    setFlags ( flags = '' ) {

        this.flags = String ( flags );

    };

    /**
     * normalizes a string by chainable options; uses cache to increase
     * performance and custom filters for advanced behavior
     * 
     * list of all supported flags:
     * 
     * s :: remove special chars
     * w :: collapse whitespaces
     * r :: remove repeated chars
     * k :: keep only letters
     * n :: ignore numbers
     * t :: trim whitespaces
     * i :: case insensitivity
     * d :: decompose unicode
     * u :: normalize unicode
     * 
     * @param {String} string string to normalize
     * @param {String} [flags=''] normalization flags
     * @returns {String} normalized string
     */
    normalize ( str, flags = '' ) {

        let res = String ( str );

        /* use normalized string from cache to increase performance */

        let key = `${res}::${flags}`;

        if ( this.#cache.has( key ) ) {

            return this.#cache.get( key );

        }

        /* apply custom filters */

        if ( this.#filter.size > 0 ) {

            this.#filter.forEach( ( filter ) => {

                res = filter.apply( null, [ res ] );

            } );

        }

        /* normalize using flags */

        if ( flags.includes( 's' ) ) res = res.replace( /[^a-z0-9]/gi, '' );
        if ( flags.includes( 'w' ) ) res = res.replace( /\s+/g, ' ' );
        if ( flags.includes( 'r' ) ) res = res.replace( /(.)\1+/g, '$1' );
        if ( flags.includes( 'k' ) ) res = res.replace( /[^a-z]/gi, '' );
        if ( flags.includes( 'n' ) ) res = res.replace( /[0-9]/g, '' );
        if ( flags.includes( 't' ) ) res = res.trim();
        if ( flags.includes( 'i' ) ) res = res.toLowerCase();
        if ( flags.includes( 'd' ) ) res = res.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' );
        if ( flags.includes( 'u' ) ) res = res.normalize( 'NFC' );

        /* store the normalized string in the cache */

        this.#cache.set( key, res );

        return res;

    };

    /**
     * clears the normalization cache
     * 
     * @returns {Boolean} always returns true
     */
    clearCache () {

        this.#cache.clear();

        return true;

    };

    /**
     * compares two string a and b using the passed algorithm
     * 
     * @param {String} algo name of the algorithm
     * @param {String} a string a
     * @param {String} b string b
     * @param {Object} [config={}] config (flags, args)
     * @returns {Mixed} similarity score (0..1) or raw output
     */
    compare ( algo, a, b, config = {} ) {

        if ( this.loadAlgo( algo ) ) {

            /* handle trivial cases */

            if ( a === b ) return 1; // strings are identical
            if ( a.length < 2 || b.length < 2 ) return 0; // too short to compare

            /* apply similarity algorithm */

            const {
                flags = this.flags,
                options = {}
            } = config;

            return this.#algorithms[ algo ].apply( null, [
                this.normalize( a, flags ),
                this.normalize( b, flags ),
                options
            ] );

        }

    };

    /**
     * tests the similarity between the base string and a target string
     * using the current algorithm
     * 
     * @param {String} str target string
     * @param {Object} [config={}] config (flags, args)
     * @returns {Mixed} similarity score (0..1) or raw output
     */
    test ( str, config = {} ) {

        if ( this.isReady() ) {

            return this.compare(
                this.algo,
                this.str, str,
                config
            );

        }

    };

    /**
     * tests the similarity of multiple strings against the base string
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {Object[]} array of objects, each containing the target string and its similarity score / raw output
     */
    batchTest ( arr, config = {} ) {

        if ( this.isReady() ) {

            return [ ...arr ].map( ( str ) => ( {
                target: str,
                match: this.test(
                    str, config
                )
            } ) );

        }

    };

    /**
     * finds strings in an array that exceed a similarity threshold
     * returns the array sorted by highest similarity
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, threshold, args)
     * @returns {Object[]} array of objects, sorted by highest similarity
     */
    match ( arr, config = {} ) {

        if ( this.isReady() ) {

            const { threshold = 0 } = config;

            delete config?.options?.raw;

            return this.batchTest(
                arr, config
            ).filter(
                ( r ) => r.match >= threshold
            ).sort(
                ( a, b ) => b.match - a.match
            );

        }

    };

    /**
     * finds the closest matching string from an array
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {String} closest matching string
     */
    closest ( arr, config = {} ) {

        if ( this.isReady() ) {

            let res = this.match(
                arr, config
            );

            return res.length
                ? res[ 0 ].target
                : undefined;

        }

    };

    /**
     * generate a similarity matrix for an array of strings
     * 
     * @param {String} algo name of the algorithm
     * @param {String[]} arr array of strings to cross-compare
     * @param {Object} [config={}] config (flags, args)
     * @returns {Number[][]} 2D array representing the similarity matrix
     */
    similarityMatrix ( algo, arr, config = {} ) {

        if ( this.loadAlgo( algo ) ) {

            delete config?.options?.raw;

            return [ ...arr ].map( ( a, i ) => {

                return [ ...arr ].map(
                    ( b, j ) => i === j ? 1 : this.compare(
                        algo, a, b, config
                    )
                );

            } );

        }

    };

};