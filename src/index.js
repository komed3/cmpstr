/**
 * npm package
 * cmpstr
 * 
 * The lightweight npm package cmpstr can be used to calculate the similarity of strings,
 * find best matches in arrays and much more. The package supports a number of built-in
 * algorithms, e.g. Levenshtein distance and Dice-Sørensen coefficient. Additional
 * custom algorithms can be added.
 * 
 * @author Paul Köhler (komed3)
 * @version 2.0.0
 * @license MIT
 */

'use strict';

/**
 * module dependencies
 * @private
 */

const CmpStr = require( './CmpStr' );
const CmpStrAsync = require( './CmpStrAsync' );

/**
 * module exports
 * @public
 */

module.exports = {
    CmpStr,
    CmpStrAsync
};