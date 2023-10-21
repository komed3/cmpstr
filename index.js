/**
 * similarstr
 * lightweight npm package to calculate string similarity
 * 
 * @author komed3 (Paul Köhler)
 * @version 1.0.0
 * @license MIT
 */

'use strict'

/**
 * calculate levenshtein similarity (in percent)
 * @param {String} str1 string 1
 * @param {String} str2 string 2
 * @returns similarity 0..1
 */
module.exports.levenshtein = ( str1, str2 ) => {

    /* convert input to string */

    str1 = str1.toString();
    str2 = str2.toString();

    if( str1 == str2 ) {

        /* both string are similar or empty */

        return 1;

    } else if( str1.length < 2 || str2.length < 2 ) {

        /* for 0-letter or 1-letter strings */

        return 0;

    } else {

        /* get levenshtein distance */

        let distance = this.levenshteinDistance( str1, str2 );

        /* return percentage */

        return 1 - (
            distance / Math.max(
                str1.length,
                str2.length
            )
        );

    }

};

/**
 * get levenshtein distance
 * @param {String} str1 string 1
 * @param {String} str2 string 2
 * @returns distance
 */
module.exports.levenshteinDistance = ( str1, str2 ) => {

    /* convert input to string */

    str1 = str1.toString();
    str2 = str2.toString();

    if( str1 == str2 ) {

        /* both string are similar or empty */

        return 0;

    } else if( str1.length == 0 ) {

        /* empty string 1 */

        return str2.length;

    } else if( str2.length == 0 ) {

        /* empty string 2 */

        return str1.length;

    } else {

        /* create matrix */

        const matrix = [];

        for( let i = 0; i <= str1.length; i++ ) {

            const row = [];

            for( let j = 0; j <= str2.length; j++ ) {

                row.push( j );

            }

            row[0] = i;

            matrix.push( row );

        }

        /* calculate distance */

        for( let i = 1; i <= str1.length; i++ ) {

        for( let j = 1; j <= str2.length; j++ ) {

            if( str1[ i - 1 ] === str2[ j - 1 ] ) {

                    matrix[ i ][ j ] = matrix[ i - 1 ][ j - 1 ];

                } else {

                    matrix[ i ][ j ] = 1 + Math.min(
                        matrix[ i ][ j - 1 ],
                        matrix[ i - 1 ][ j - 1 ], 
                        matrix[ i - 1 ][ j ]
                    );

                }
            }

        }

        /* return levenshtein distance */

        return matrix[ str1.length ][ str2.length ];

    }

};