/**
 * similarstr
 * test string similarity
 * 
 * @author komed3 (Paul Köhler)
 * @version 1.0.0
 * @license MIT
 */

'use strict'

var test, res;

/**
 * load similarstr
 */
const similarstr = require( './index' );

/**
 * test levenshtein distance
 */
console.log( '>> test levenshtein distance' );

test = [
    [ 'kitten', 'sitten', 1 ],
    [ 'elephant', 'relevant', 3 ]
];

test.forEach( ( t ) => {

    console.log( t[0], t[1], 'expected', t[2] );

    console.time( 'runtime' );

    res = similarstr.levenshteinDistance( t[0], t[1] );

    console.timeEnd( 'runtime' );

    console.log( 'output', res, '>>', t[2] == res );

} );

/**
 * test levenshtein similarity
 */
console.log( '>> test levenshtein similarity' );

test = [
    [ 'wonder', 'word', 0.5 ],
    [ 'Saturday', 'Sunday', 0.625 ]
];

test.forEach( ( t ) => {

    console.log( t[0], t[1], 'expected', t[2] );

    console.time( 'runtime' );

    res = similarstr.levenshtein( t[0], t[1] );

    console.timeEnd( 'runtime' );

    console.log( 'output', res, '>>', t[2] == res );

} );

/**
 * test levenshtein closest target search
 */
console.log( '>> test levenshtein closest target search' );

test = [
    [ 'similar', [ 'same', 'also', 'similary', 'suchlike', 'related' ], 'similary' ],
    [ 'fast', [ 'slow', 'faster', 'fastest' ], 'faster' ]
];

test.forEach( ( t ) => {

    console.log( t[0], t[1], 'expected', t[2] );

    console.time( 'runtime' );

    res = similarstr.levenshteinClosest( t[0], t[1] );

    console.timeEnd( 'runtime' );

    console.log( 'output', res, '>>', t[2] == res );

} );