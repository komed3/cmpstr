/**
 * npm package
 * cmpstr
 * 
 * The cmpstr package is a powerful and lightweight library for calculating string similarity,
 * finding the closest matches in arrays, performing phonetic searches, and more. It supports
 * a variety of built-in algorithms, including Levenshtein distance, Dice-Sørensen coefficient,
 * Damerau-Levenshtein, Soundex, and many others. Users can also add custom algorithms and
 * normalization filters to extend its functionality.
 * 
 * key features:
 * - built-in support for multiple similarity algorithms
 * - phonetic search with language-specific configurations
 * - batch operations and similarity matrices for large datasets
 * - customizable normalization with global flags and caching
 * - asynchronous support for non-blocking workflows
 * 
 * usage:
 * - compare strings for similarity using various algorithms
 * - find the closest match from an array of strings
 * - perform phonetic searches with raw or similarity-based results
 * - generate similarity matrices for cross-comparisons
 * 
 * @author Paul Köhler (komed3)
 * @version 2.0.3
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