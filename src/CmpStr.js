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
     * --------------------------------------------------
     * Global Variables
     * --------------------------------------------------
     */

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
     * stores the names of loaded algorithms
     * 
     * @since 2.0.2
     * @private
     * @type {Set<String>}
     */
    #loadedAlgo = new Set ();

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
     * @type {Map<String, Object[]>}
     */
    #filter = new Map ();

    /**
     * default normalization flags
     * set by setFlags()
     * 
     * @private
     * @type {String}
     */
    #flags = '';

    /**
     * current algorithm to use for similarity calculations
     * set by setAlgo(), addAlgo() or constructor()
     * 
     * @private
     * @type {String}
     */
    #algo;

    /**
     * base string for comparison
     * set by setStr or constructor()
     * 
     * @private
     * @type {String}
     */
    #str;

    /**
     * stores the current ready state
     * 
     * @since 2.0.2
     * @private
     * @type {Boolean}
     */
    #readyState = false;

    /**
     * --------------------------------------------------
     * Constructor
     * --------------------------------------------------
     */

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
     * --------------------------------------------------
     * Ready State
     * --------------------------------------------------
     */

    /**
     * checks whether string and algorithm are set correctly
     * 
     * @returns {Boolean} true if ready, false otherwise
     */
    isReady () {

        return this.#readyState;

    };

    /**
     * updates the readiness state
     * 
     * @since 2.0.2
     * @private
     */
    #updateReadyState () {

        this.#readyState = (
            typeof this.#algo === 'string' &&
            this.isAlgo( this.#algo ) &&
            typeof this.#str === 'string' &&
            this.#str.length !== 0
        );

    };

    /**
     * checks ready state and throws an error if not
     * 
     * @private
     * @returns {Boolean} true if ready
     * @throws {Error} if CmpStr is not ready
     */
    #checkReady () {

        if ( !this.#readyState ) {

            throw new Error(
                `CmpStr instance is not ready. Ensure the algorithm and base string are set.`
            );

        }

        return true;

    };

    /**
     * --------------------------------------------------
     * Base String
     * --------------------------------------------------
     */

    /**
     * sets the base string for comparison
     * 
     * @param {String} str string to set as the base
     * @returns {Boolean} always returns true
     */
    setStr ( str ) {

        this.#str = String ( str );

        this.#updateReadyState();

        return true;

    };

    /**
     * gets the base string for comparison
     * 
     * @since 2.0.2
     * @returns {String} base string
     */
    getStr () {

        return this.#str;

    };

    /**
     * --------------------------------------------------
     * Algorithms
     * --------------------------------------------------
     */

    /**
     * list all registered or loaded similarity algorithms
     * 
     * @param {Boolean} [loadedOnly=false] it true, only loaded algorithm names are returned
     * @returns {String[]} array of algorithm names
     */
    listAlgo ( loadedOnly = false ) {

        return loadedOnly
            ? [ ...this.#loadedAlgo ]
            : [ ...Object.keys( this.#algorithms ) ];

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
     * sets the current algorithm to use for similarity calculations
     * 
     * @param {String} algo name of the algorithm
     * @returns {Boolean} true if the algorithm has been set
     */
    setAlgo ( algo ) {

        if ( this.#loadAlgo( algo ) ) {

            this.#algo = algo;

            this.#updateReadyState();

            return true;

        }

    };

    /**
     * gets the current algorithm to use for similarity calculations
     * 
     * @since 2.0.2
     * @returns {String} name of the algorithm
     */
    getAlgo () {

        return this.#algo;

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

            throw new Error (
                `Algorithm "${algo}" cannot be added.`
            );

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

            this.#loadedAlgo.delete( algo );

            if ( this.#algo === algo ) {

                /* reset current algorithm if it was removed */

                this.#algo = undefined;

                this.#updateReadyState();

            }

            return true;

        } else {

            throw new Error (
                `Algorithm "${algo}" is not defined.`
            );

        }

    };

    /**
     * lazy-loads the specified algorithm module
     * 
     * @private
     * @param {String} algo name of the similarity algorithm
     * @returns {Boolean} true if the algorithm is loaded
     * @throws {Error} if the algorithm cannot be loaded or is not defined
     */
    #loadAlgo ( algo ) {

        if ( this.#loadedAlgo.has( algo ) ) {

            return true;

        } else if ( this.isAlgo( algo ) ) {

            let typeOf = typeof this.#algorithms[ algo ];

            if ( typeOf === 'function' ) {

                this.#loadedAlgo.add( algo );

                return true;

            } else if ( typeOf === 'string' ) {

                try {

                    /* lazy-load algorithm module */

                    this.#algorithms[ algo ] = require(
                        this.#algorithms[ algo ]
                    );

                    this.#loadedAlgo.add( algo );

                    return true;

                } catch ( err ) {

                    throw new Error (
                        `Failed to load algorithm "${algo}".`,
                        { cause: err }
                    );

                }

            } else {

                throw new Error (
                    `Algorithm "${algo}" cannot be loaded.`
                );

            }

        } else {

            throw new Error (
                `Algorithm "${algo}" is not defined.`
            );

        }

    };

    /**
     * --------------------------------------------------
     * Custom Filters
     * --------------------------------------------------
     */

    /**
     * list all added or artice filter names
     * 
     * @param {Boolean} [activeOnly=false] if true, only names of active filters are returned
     * @returns {String[]} array of filter names
     */
    listFilter ( activeOnly = false ) {

        return activeOnly
            ? Array.from( this.#filter.entries() )
                .filter( ( [ _, filter ] ) => filter.active )
                .map( ( [ name ] ) => name )
            : [ ...this.#filter.keys() ];

    };

    /**
     * adds a custom normalization filter
     * 
     * @param {String} name filter name
     * @param {Function} callback function implementing the filter (must accept a string and returns a normalized one)
     * @param {Int} [priority=10] priority of the filter (lower numbers are processed first)
     * @returns {Boolean} returns true if the filter was added successfully
     * @throws {Error} if the filter cannot be added
     */
    addFilter ( name, callback, priority = 10 ) {

        if (
            !this.#filter.has( name ) &&
            typeof callback === 'function' &&
            callback.length == 1 &&
            typeof callback.apply( null, [ 'abc' ] ) === 'string'
        ) {

            this.#filter.set( name, {
                callback, priority,
                active: true
            } );

            this.clearCache();

            return true;

        } else {

            throw new Error (
                `Filter "${filter}" cannot be added.`
            );

        }

    };

    /**
     * removes a custom normalization filter
     * 
     * @param {String} name filter name
     * @returns {Boolean} true if the filter was removed successfully
     * @throws {Error} if the filter does not exists
     */
    rmvFilter ( name ) {

        if ( this.#filter.delete( name ) ) {

            this.clearCache();

            return true;

        } else {

            throw new Error (
                `Filter "${filter}" does not exists.`
            );

        }

    };

    /**
     * pauses a custom normalization filter
     * 
     * @param {String} name filter name
     * @returns {Boolean} true if the filter was paused successfully
     * @throws {Error} if the filter does not exists
     */
    pauseFilter ( name ) {

        if ( this.#filter.has( name ) ) {

            this.#filter.get( name ).active = false;

            this.clearCache();

            return true;

        } else {

            throw new Error (
                `Filter "${filter}" does not exists.`
            );

        }

    };

    /**
     * resumes a custom normalization filter
     * 
     * @param {String} name filter name
     * @returns {Boolean} true if the filter was resumed successfully
     * @throws {Error} if the filter does not exists
     */
    resumeFilter ( name ) {

        if ( this.#filter.has( name ) ) {

            this.#filter.get( name ).active = true;

            this.clearCache();

            return true;

        } else {

            throw new Error (
                `Filter "${filter}" does not exists.`
            );

        }

    };

    /**
     * clears normalization filters (remove all of them)
     * 
     * @returns {Boolean} always returns true
     */
    clearFilter () {

        this.#filter.clear();

        this.clearCache();

        return true;

    };

    /**
     * applies all active filters to a string
     * 
     * @private
     * @param {String} str string to process
     * @returns {String} filtered string
     * @throws {Error} if applying filters cause an error
     */
    #applyFilters ( str ) {

        try {

            return Array.from( this.#filter.values() ).flat().filter(
                ( filter ) => filter.active
            ).sort(
                ( a, b ) => a.priority - b.priority
            ).reduce(
                ( res, filter ) => filter.callback.apply( null, [ res ] ),
                String ( str )
            );

        } catch ( err ) {

            throw new Error (
                `Error while applying filters.`,
                { cause: err }
            );

        }

    };

    /**
     * --------------------------------------------------
     * Normalization
     * --------------------------------------------------
     */

    /**
     * set default normalization flags
     * 
     * @param {String} [flags=''] normalization flags
     * @returns {Boolean} always returns true
     */
    setFlags ( flags = '' ) {

        this.#flags = String ( flags );

    };

    /**
     * get default normalization flags
     * 
     * @since 2.0.2
     * @returns {String} normalization flags
     */
    getFlags () {

        return this.#flags;

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
     * @param {String|String[]} string string(s) to normalize
     * @param {String} [flags=''] normalization flags
     * @returns {String|String[]} normalized string(s)
     * @throws {Error} if normalization cause an error
     */
    normalize ( input, flags = '' ) {

        const processStr = ( str ) => {

            let res = String ( str );

            /* use normalized string from cache to increase performance */

            let key = `${res}::${flags}`;

            if ( this.#cache.has( key ) ) {

                return this.#cache.get( key );

            }

            /* apply custom filters */

            res = this.#applyFilters( res );

            /* normalize using flags */

            try {

                if ( flags.includes( 's' ) ) res = res.replace( /[^a-z0-9]/gi, '' );
                if ( flags.includes( 'w' ) ) res = res.replace( /\s+/g, ' ' );
                if ( flags.includes( 'r' ) ) res = res.replace( /(.)\1+/g, '$1' );
                if ( flags.includes( 'k' ) ) res = res.replace( /[^a-z]/gi, '' );
                if ( flags.includes( 'n' ) ) res = res.replace( /[0-9]/g, '' );
                if ( flags.includes( 't' ) ) res = res.trim();
                if ( flags.includes( 'i' ) ) res = res.toLowerCase();
                if ( flags.includes( 'd' ) ) res = res.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' );
                if ( flags.includes( 'u' ) ) res = res.normalize( 'NFC' );

            } catch ( err ) {

                throw new Error (
                    `Error while normalization.`,
                    { cause: err }
                );

            }

            /* store the normalized string in the cache */

            this.#cache.set( key, res );

            return res;

        }

        /* processing multiple string */

        if ( Array.isArray( input ) ) {

            return input.map(
                ( str ) => processStr( str )
            );

        }

        return processStr( input );

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
     * --------------------------------------------------
     * Similarity Comparison
     * --------------------------------------------------
     */

    /**
     * compares two string a and b using the passed algorithm
     * 
     * @param {String} algo name of the algorithm
     * @param {String} a string a
     * @param {String} b string b
     * @param {Object} [config={}] config (flags, args)
     * @returns {Mixed} similarity score (0..1) or raw output
     * @throws {Error} if algorithm cause an error
     */
    compare ( algo, a, b, config = {} ) {

        if ( this.#loadAlgo( algo ) ) {

            /* handle trivial cases */

            if ( a === b ) return 1; // strings are identical
            if ( a.length < 2 || b.length < 2 ) return 0; // too short to compare

            /* apply similarity algorithm */

            const {
                flags = this.#flags,
                options = {}
            } = config;

            try {

                return this.#algorithms[ algo ].apply( null, [
                    this.normalize( a, flags ),
                    this.normalize( b, flags ),
                    options
                ] );

            } catch ( err ) {

                throw new Error (
                    `Error in algorithm "${algo}".`,
                    { cause: err }
                );

            }

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

        if ( this.#checkReady() ) {

            return this.compare(
                this.#algo,
                this.#str, str,
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

        if ( this.#checkReady() ) {

            return [ ...arr ].map( ( str ) => ( {
                target: str,
                match: this.compare(
                    this.#algo,
                    this.#str, str,
                    config
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

        const { threshold = 0 } = config;

        delete config?.options?.raw;

        return this.batchTest(
            arr, config
        ).filter(
            ( r ) => r.match >= threshold
        ).sort(
            ( a, b ) => b.match - a.match
        );

    };

    /**
     * finds the closest matching string from an array
     * 
     * @param {String[]} arr array of strings
     * @param {Object} [config={}] config (flags, args)
     * @returns {String} closest matching string
     */
    closest ( arr, config = {} ) {

        let res = this.match(
            arr, config
        );

        return res.length && res[ 0 ].match > 0
            ? res[ 0 ].target
            : undefined;

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

        if ( this.#loadAlgo( algo ) ) {

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