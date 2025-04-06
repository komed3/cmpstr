/**
 * Jaro-Winkler Distance
 * CmpStr module
 * 
 * Jaro-Winkler is a string similarity metric that gives more weight to
 * matching characters at the start of the strings.
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
 * @param {Object} options having {
 *   @param {Boolean} [raw=false] if true the raw distance is returned
 * }
 * @returns {Number} similarity score (0..1) or distance
 */
module.exports = ( a, b, { raw = false } = {} ) => {

    /* step 1: check for matches between strings */

    let matchWindow = Math.floor(
        Math.max( a.length, b.length ) / 2
    ) - 1;

    let aMatches = Array( a.length ).fill( false ),
        bMatches = Array( b.length ).fill( false );

    let matches = 0;

    for ( let i = 0; i < a.length; i++ ) {

        for (
            let j = Math.max( 0, i - matchWindow );
            j < Math.min( i + matchWindow + 1, b.length );
            j++
        ) {

            if ( !bMatches[ j ] && a[ i ] === b[ j ] ) {

                aMatches[ i ] = true;
                bMatches[ j ] = true;

                matches++;

                break;

            }

        }

    }

    if ( matches === 0 ) {

        /* if no matches found, return 0 */

        return 0;

    }

    /* step 2: calculate transpositions */

    let transpos = 0,
        k = 0;

    for ( let i = 0; i < a.length; i++ ) {

        if ( aMatches[ i ] ) {

            while ( !bMatches[ k ] ) k++;

            if ( a[ i ] !== b[ k ] ) transpos++;

            k++;

        }

    }

    /* step 3: calculate Jaro-Winkler distance */

    let jaro = (
        ( matches / a.length ) +
        ( matches / b.length ) +
        ( matches - ( transpos / 2 ) ) /
        matches
    ) / 3;

    /* step 4: get Jaro-Winkler as value between 0..1 */

    return raw ? jaro : jaro + Math.min(
        4, [ ...a ].findIndex(
            ( char, i ) => char !== b[ i ]
        ) || 0
    ) * 0.1 * ( 1 - jaro );

};