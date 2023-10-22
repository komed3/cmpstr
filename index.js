/**
 * cmpstr
 * lightweight npm package to calculate string similarity
 * 
 * @author komed3 (Paul Köhler)
 * @version 1.0.1
 * @license MIT
 */

'use strict'

/**
 * basic functions
 * @private
 */

/**
 * normalize string
 * @param {String} str string
 * @returns normalized string
 */
const normalize = ( str ) => {

    return str.toString();

};

/**
 * get bigrams from string
 * @param {String} str string
 * @returns bigrams
 */
const str2bigrams = ( str ) => {

    let bigrams = new Set();

    for( let i = 0; i < str.length - 1; i++ ) {

        bigrams.add(
            str.substring( i, i + 2 )
        );

    }

    return bigrams;

};

/**
 * 
 * @param {String} algo algorithm to use
 * @param {String} a string 1
 * @param {String} b string 2
 * @returns similarity
 */
const cpmByAlgo = ( algo, a, b ) => {

    switch( algo ) {

        case 'levenshtein':
            return levenshtein( a, b );

        case 'diceCoefficient':
            return diceCoefficient( a, b );

        default:
            return 0;

    }

};

/**
 * search for closest string
 * @param {String} algo algorithm to use
 * @param {String} test test string
 * @param {Array} arr targets to test
 * @returns closest target
 */
const findClosest = ( algo, test, arr ) => {

    let best = -Infinity,
        idx = 0,
        pct;

    /* search for closest element in arr */

    arr.forEach( ( str, i ) => {

        pct = cpmByAlgo( algo, test, str );

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
 * sort best matches to test string
 * @param {String} algo algorithm to use
 * @param {String} test test string
 * @param {Array} arr targets to test
 * @returns sorted matches
 */
const bestMatch = ( algo, test, arr ) => {

    let matches = [],
        pct;

    /* calculate similarity for each arr items */

    arr.forEach( ( str ) => {

        pct = cpmByAlgo( algo, test, str );

        matches.push( {
            target: str,
            match: pct
        } );

    } );

    /* sort by highest similarity */

    let sorted = matches.sort( ( a, b ) => {
        return b.match - a.match;
    } );

    /* return sorted matches */

    return sorted;

};

/**
 * similarity calculations
 * @public
 */

/**
 * calculate levenshtein similarity (in percent)
 * @param {String} a string 1
 * @param {String} b string 2
 * @returns similarity 0..1
 */
const levenshtein = ( a, b ) => {

    /* normalize string */

    a = normalize( a );
    b = normalize( b );

    if( a == b ) {

        /* both string are similar or empty */

        return 1;

    } else if( a.length < 2 || b.length < 2 ) {

        /* for 0-letter or 1-letter strings */

        return 0;

    } else {

        /* get levenshtein distance */

        let distance = levenshteinDistance( a, b );

        /* return percentage */

        return 1 - (
            distance / Math.max(
                a.length,
                b.length
            )
        );

    }

};

/**
 * get levenshtein distance
 * @param {String} a string 1
 * @param {String} b string 2
 * @returns distance
 */
const levenshteinDistance = ( a, b ) => {

    /* normalize string */

    a = normalize( a );
    b = normalize( b );

    if( a == b ) {

        /* both string are similar or empty */

        return 0;

    } else if( a.length == 0 ) {

        /* empty string 1 */

        return b.length;

    } else if( b.length == 0 ) {

        /* empty string 2 */

        return a.length;

    } else {

        /* create matrix */

        const matrix = [];

        for( let i = 0; i <= a.length; i++ ) {

            const row = [];

            for( let j = 0; j <= b.length; j++ ) {

                row.push( j );

            }

            row[0] = i;

            matrix.push( row );

        }

        /* calculate distance */

        for( let i = 1; i <= a.length; i++ ) {

            for( let j = 1; j <= b.length; j++ ) {

                if( a[ i - 1 ] === b[ j - 1 ] ) {

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

        return matrix[ a.length ][ b.length ];

    }

};

/**
 * search for closest target to test string
 * @param {String} test test string
 * @param {Array} arr targets to test
 * @returns closest target
 */
const levenshteinClosest = ( test, arr ) => {

    return findClosest( 'levenshtein', test, arr );

};

/**
 * sort best matches to test string
 * @param {String} test test string
 * @param {Array} arr targets to test
 * @returns sorted matches
 */
const levenshteinMatch = ( test, arr ) => {

    return bestMatch( 'levenshtein', test, arr );

};

/**
 * calculate dice coefficient
 * @param {String} a string 1
 * @param {String} b string 2
 * @returns dice coefficient
 */
const diceCoefficient = ( a, b ) => {

    /* normalize string */

    a = normalize( a );
    b = normalize( b );

    if( a == b ) {

        /* both string are similar or empty */

        return 1;

    } else if( a.length < 2 || b.length < 2 ) {

        /* for 0-letter or 1-letter strings */

        return 0;

    } else {

        /* get bigrams */

        let setA = str2bigrams( a ),
            setB = str2bigrams( b );

        /* calculate dice coefficient */

        return (
            ( new Set( [ ...setA ].filter( ( x ) => {
                return setB.has( x );
            } ) ) ).size * 2
        ) / (
            setA.size +
            setB.size
        );

    }

}

/**
 * search for closest target to test string
 * @param {String} test test string
 * @param {Array} arr targets to test
 * @returns closest target
 */
const diceClosest = ( test, arr ) => {

    return findClosest( 'diceCoefficient', test, arr );

};

/**
 * sort best matches to test string
 * @param {String} test test string
 * @param {Array} arr targets to test
 * @returns sorted matches
 */
const diceMatch = ( test, arr ) => {

    return bestMatch( 'diceCoefficient', test, arr );

};

/**
 * export module functions
 */
module.exports = {
    levenshtein,
    levenshteinDistance,
    levenshteinClosest,
    levenshteinMatch,
    diceCoefficient,
    diceClosest,
    diceMatch
};