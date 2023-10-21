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
 * basic functions
 * @private
 */

/**
 * get bigrams from string
 * @param {String} str string
 * @returns bigrams
 */
var getBigrams = ( str ) => {

    let bigrams = new Set();

    for( let i = 0; i < str.length - 1; i++ ) {

        bigrams.add(
            str.substring( i, i + 2 )
        );

    }

    return bigrams;

};

/**
 * search for closest string
 * @param {String} algo algorithm to use
 * @param {String} test test string
 * @param  {Array} arr targets to test
 * @returns closest target
 */
var findClosest = ( algo, test, arr ) => {

    let best = -Infinity,
        idx = 0,
        pct;

    /* search for closest element in arr */

    arr.forEach( ( str, i ) => {

        switch( algo ) {

            case 'levenshtein':
                pct = levenshtein( test, str );
                break;

            case 'diceCoefficient':
                pct = diceCoefficient( test, str );
                break;

            default:
                pct = 0;
                break;

        }

        if( pct > best ) {

            /* save closest target */

            best = pct;
            idx = i;

        }

    } );

    /* return closest target */

    return arr[ idx ];

};

/**
 * similarity calculations
 * @public
 */

/**
 * calculate levenshtein similarity (in percent)
 * @param {String} str1 string 1
 * @param {String} str2 string 2
 * @returns similarity 0..1
 */
const levenshtein = ( str1, str2 ) => {

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

        let distance = levenshteinDistance( str1, str2 );

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
const levenshteinDistance = ( str1, str2 ) => {

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

/**
 * search for closest target to test string
 * @param {String} test test string
 * @param  {Array} arr targets to test
 * @returns closest target
 */
const levenshteinClosest = ( test, arr ) => {

    return findClosest( 'levenshtein', test, arr );

};

/**
 * calculate dice coefficient
 * @param {String} str1 string 1
 * @param {String} str2 string 2
 * @returns dice coefficient
 */
var diceCoefficient = ( str1, str2 ) => {

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

        /* get bigrams */

        let bigrams1 = getBigrams( str1 ),
            bigrams2 = getBigrams( str2 );

        /* calculate dice coefficient */

        return (
            ( new Set( [ ...bigrams1 ].filter( ( x ) => {
                return bigrams2.has( x );
            } ) ) ).size * 2
        ) / (
            bigrams1.size +
            bigrams2.size
        );

    }

}

/**
 * search for closest target to test string
 * @param {String} test test string
 * @param  {Array} arr targets to test
 * @returns closest target
 */
const diceClosest = ( test, arr ) => {

    return findClosest( 'diceCoefficient', test, arr );

};

/**
 * export module functions
 */
module.exports = {
    levenshtein,
    levenshteinDistance,
    levenshteinClosest,
    diceCoefficient,
    diceClosest
};