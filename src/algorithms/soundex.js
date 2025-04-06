/**
 * Soundex Algorithm
 * CmpStr module
 * 
 * The Soundex algorithm generates a phonetic representation of a string
 * based on how it sounds. It supports predefined setups for English and
 * German and allows users to provide custom options.
 * 
 * @author Paul Köhler
 * @license MIT
 */

'use strict';

/**
 * predefined phonetic mappings / excluded chars for supported languages
 * @private
 */
const soundexConfig = {
    en: {
        exclude: 'AEIOUHWY',
        mapping: {
            B: '1', F: '1', P: '1', V: '1',
            C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
            D: '3', T: '3',
            L: '4',
            M: '5', N: '5',
            R: '6'
        }
    },
    de: {
        exclude: 'AEIOUÄÖÜHWY',
        mapping: {
            B: '1', P: '1', F: '1', V: '1',
            C: '2', G: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2', J: '2',
            D: '3', T: '3',
            L: '4',
            M: '5', N: '5',
            R: '6'
        }
    }
};

/**
 * private helper function
 * generate soundex code from string
 * @private
 * 
 * @param {String} str string to create soundex code for
 * @param {Object} mapping soundex mapping
 * @param {String} exclude characters to exclude from the input
 * @param {Number} maxLength maximum length of the phonetic code
 * @returns {String} soundex code
 */
const _generateSoundex = ( str, mapping, exclude, maxLength ) => {

    let normalized = str.toUpperCase().replace(
        new RegExp( `[${exclude}]`, 'g' ), ''
    );

    let soundexCode = normalized[ 0 ],
        prevCode = mapping[ soundexCode ] || '';

    for ( let i = 1; i < normalized.length; i++ ) {

        let code = mapping[ normalized[ i ] ] || '';

        if ( code !== prevCode && code !== '' ) {

            soundexCode += code;

        }

        prevCode = code;

    }

    /* pad or truncate the code to the desired length */

    return soundexCode
        .padEnd( maxLength, '0' )
        .slice( 0, maxLength );

};

/**
 * module exports
 * @public
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @param {Object} options having {
 *   @param {String} [lang='en'] language code for predefined setups (e.g., 'en', 'de')
 *   @param {Boolean} [raw=false] if true, returns the raw sound index codes
 *   @param {Object} [mapping] custom phonetic mapping (overrides predefined)
 *   @param {String} [exclude=''] characters to exclude from the input (overrides predefined)
 *   @param {Number} [maxLength=4] maximum length of the phonetic code
 * }
 * @returns {Number|Object} similarity score (0..1) or raw soundex codes
 */

module.exports = ( a, b, {
    lang = 'en',
    raw = false,
    mapping = null,
    exclude = null,
    maxLength = 4
} = {} ) => {

    /* step 1: load mapping and excluded chars or use custom data */

    let pMapping = mapping || soundexConfig[ lang ].mapping || soundexConfig.en.mapping,
        pExclude = exclude || soundexConfig[ lang ].exclude || soundexConfig.en.exclude;

    /* step 2: generate soundex codes for both strings */

    let soundexA = _generateSoundex( a, pMapping, pExclude, maxLength ),
        soundexB = _generateSoundex( b, pMapping, pExclude, maxLength );

    if ( raw ) {

        /* return raw soundex codes */

        return {
            a: soundexA,
            b: soundexB
        };

    }

    /* step 3: calculate similarity between soundex codes */

    let maxLen = Math.max(
        soundexA.length,
        soundexB.length
    );

    let matches = 0;

    for ( let i = 0; i < maxLen; i++ ) {

        if ( soundexA[ i ] === soundexB[ i ] ) {

            matches++;

        }

    }

    return matches / maxLen;

};