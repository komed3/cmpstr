'use strict';

/**
 * Jaro-Winkler Distance
 * 
 * Jaro-Winkler is a string similarity metric that gives more weight to
 * matching characters at the start of the strings.
 * 
 * @param {String} a string a
 * @param {String} b string b
 * @returns {Number} similarity (0..1)
 */
module.exports = ( a, b ) => {

    if ( a === b ) {

        /* both string are similar or empty */

        return 1;

    } else if ( a.length < 2 || b.length < 2 ) {

        /* for not similar 0- or 1-letter strings */

        return 0;

    } else {

        /**
         * for all other strings calculate Jaro-Winkler Distance
         */

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

        let transpositions = 0,
            k = 0;

        for ( let i = 0; i < a.length; i++ ) {

            if ( aMatches[ i ] ) {

                while ( !bMatches[ k ] ) k++;

                if ( a[ i ] !== b[ k ] ) transpositions++;

                k++;

            }

        }

        /* step 3: calculate Jaro-Winkler distance */

        let jaroScore = (
            ( matches / a.length ) +
            ( matches / b.length ) +
            ( matches - ( transpositions / 2 ) ) /
            matches
        ) / 3;

        /* step 4: get Jaro-Winkler distance as percentage */

        return jaroScore + Math.min( 4, [ ...a ].findIndex(
            ( char, i ) => char !== b[ i ]
        ) || 0 ) * 0.1 * ( 1 - jaroScore );

    }

};