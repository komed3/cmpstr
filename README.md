# CmpStr `v2.0`

CmpStr is a lightweight and powerful npm package for calculating string similarity, finding the closest matches in arrays, performing phonetic searches, and more. It supports a variety of built-in algorithms (e.g., Levenshtein, Dice-Sørensen, Damerau-Levenshtein, Soundex) and allows users to add custom algorithms and normalization filters.

**Key Features**

- Built-in support for multiple similarity algorithms.
- Phonetic search with language-specific configurations (e.g., Soundex).
- Batch operations and similarity matrices for large datasets.
- Customizable normalization with global flags and caching.
- Asynchronous support for non-blocking workflows.
- Extensible with custom algorithms and filters.
- TypeScript definitions for better developer experience.

## Installation

Install the package via npm:

```bash
npm install cmpstr
```

## Basic Usage

Importing the Package:

```js
const { CmpStr } = require( 'cmpstr' );
```

Example 1: Basic String Similarity

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.test( 'Hallo', { flags: 'i' } ) );
// Output: 0.8
```

Example 2: Phonetic Search

```js
const cmp = new CmpStr( 'soundex', 'Robert' );

console.log( cmp.test( 'Rubin', { options: { raw: true } } ) );
// Output: { a: 'R163', b: 'R150' }
```

## Methods

Creating a new instance of `CmpStr` or `CmpStrAsync` allows passing the algorithm to be used and the base string as optional arguments. Alternatively or later in the process, the `setAlgo` and `setStr` methods can be used for this purpose.

### Basics

#### `isReady()`

Checks whether string and algorithm are set correctly. Returns `true`, if the class is ready to perform similarity checks, false otherwise.

#### `setStr( str )`

Sets the base string for comparison.

Parameters:

`<String> str` – string to set as the base

#### `setFlags( [ flags = '' ] )`

Set default normalization flags. They will be overwritten by passing `flags` through the configuration object. See description of available flags / normalization options below in the documentation.

Parameters:

`<String> flags` – normalization flags

#### `clearCache()`

Clears the normalization cache.

### Algorithms

#### `listAlgo()`

List all registered similarity algorithms.

#### `isAlgo( algo )`

Checks if an algorithm is registered. Returns `true` if so, `false` otherwise.

Parameters:

`<String> algo` – name of the algorithm

#### `setAlgo( algo )`

Sets the current algorithm to use for similarity calculations.

Allowed options for build-in althorithms are `cosine`, `damerau`, `dice`, `hamming`, `jaccard`, `jaro`, `lcs`, `levenshtein`, `needlemanWunsch`, `qGram`, `smithWaterman` and `soundex`.

Parameters:

`<String> algo` – name of the algorithm

#### `addAlgo( algo, callback [, useIt = true ] )`

Adding a new similarity algorithm by using the `addAlgo()` method passing the name and a callback function, that must accept at least two strings and return a number. If `useIt` is `true`, the new algorithm will automatically be set as the current one.

Parameters:

`<String> algo` – name of the algorithm  
`<Function> callback` – callback function implementing the algorithm  
`<Boolean> useIt` – whether to set this algorithm as the current one

Example:

```js
const cmp = new CmpStr();

cmp.addAlgo( 'customAlgo', ( a, b ) => {
  return a === b ? 1 : 0;
} );

console.log( cmp.compare( 'customAlgo', 'hello', 'hello' ) );
// Output: 1
```

#### `rmvAlgo( algo )`

Removing a registered similarity algorithm.

Parameters:

`<String> algo` – name of the algorithm

### Filters

#### `listFilter()`

List all added filters.

#### `addFilter( name, callback [, priority = 10 ] )`

Adds a custom normalization filter. Needs to be passed a unique name and callback function accepting a string and returns a normalized one. Prioritizing filters by setting higher priority (default is `10`).

Parameters:

`<String> name` – filter name  
`<Function> callback` – callback function implementing the filter  
`<Int> priority` – priority of the filter

Example:

```js
const cmp = new CmpStr();

cmp.addFilter( 'prefix', ( str ) => `prefix_${str}` );
```

#### `rmvFilter( name )`

Removes a custom normalization filter.

Parameters:

`<String> name` – filter name

#### `pauseFilter( name )`

Pauses a custom normalization filter.

Parameters:

`<String> name` – filter name

#### `resumeFilter( name )`

Resumes a custom normalization filter.

Parameters:

`<String> name` – filter name

#### `clearFilter( name )`

Clears normalization filters (removing all of them).

### Similarity Comparison

#### `compare( algo, a, b [, config = {} ] )`

Compares two strings using the specified algorithm. The method returns either the similarity score as a floating point number between 0 and 1 or raw output, if the algorithm supports it and the user passes `raw=true` through the config options.

Parameters:

`<String> algo` – name of the algorithm  
`<String> a` – first string  
`<String> b` – second string  
`<Object> config` – configuration object

Example:

```js
const cmp = new CmpStr();

console.log( cmp.compare( 'levenshtein', 'hello', 'hallo' ) );
// Output: 0.8
```

#### `test( str [, config = {} ] )`

Tests the similarity between the base string and a given target string. Returns the same as ``compare``.

Parameters:

`<String> str` – target string  
`<Object> config` – configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.test( 'hallo' ) );
// Output: 0.8
```

#### `batchTest( arr [, config = {} ] )`

Tests the similarity of multiple strings against the base string. Returns an array of objects with the target string and either the similarity score as a floating point number between 0 and 1 or raw output, if the algorithm supports it and the user passes `raw=true` through the config options.

Parameters:

`<String[]> arr` – array of strings  
`<Object> config` – configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.batchTest( [ 'hallo', 'hola', 'hey' ] ) );
// Output: [ { target: 'hallo', match: 0.8 }, { target: 'hola', match: 0.4 }, { target: 'hey', match: 0.4 } ]
```

#### `match( arr [, config = {} ] )`

Finds strings in an array that exceed a similarity threshold and sorts them by highest similarity. Returns an array of objects contain target string and similarity score as a floating point number between 0 and 1.

Parameters:

`<String[]> arr` – array of strings  
`<Object> config` – configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.batchTest( [ 'hallo', 'hola', 'hey' ], {
  threshold: 0.5
} ) );
// Output: [ { target: 'hallo', match: 0.8 } ]
```

#### `closest( arr [, config = {} ] )`

Finds the closest matching string from an array and returns them.

Parameters:

`<String[]> arr` – array of strings  
`<Object> config` – configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.batchTest( [ 'hallo', 'hola', 'hey' ] ) );
// Output: 'hallo'
```

#### `similarityMatrix( algo, arr [, config = {} ] )`

Generates a similarity matrix for an array of strings. Returns an 2D array that represents the similarity matrix by floating point numbers between 0 and 1.

Parameters:

`<String> algo` – name of the algorithm  
`<String[]> arr` – array of strings  
`<Object> config` – configuration object

Example:

```js
const cmp = new CmpStr();

console.log( cmp.similarityMatrix( 'levenshtein', [
  'hello', 'hallo', 'hola'
] ) );
// Output: [ [ 1, 0.8, 0.4 ], [ 0.8, 1, 0.4 ], [ 0.4, 0.4, 1 ] ]
```

## Customization

### Normalize Strings

The `CmpStr` package allows strings to be normalized before the similarity comparison. Options listed below are available for this and can either be set globally via `setFlags` or passed using the config object, which will overwrite the global flags. Flags are passed as a chained string in any order. For improved performance, normalized strings are stored in the cache, which can be freed using the `clearCache` method. Modifying custom filters automatically deletes the cache.

#### Supported Flags

`s` – remove special chars  
`w` – collapse whitespaces  
`r` – remove repeated chars  
`k` – keep only letters  
`n` – ignore numbers  
`t` – trim whitespaces  
`i` – case insensitivity  
`d` – decompose unicode  
`u` – normalize unicode

#### `normalize( str [, flags = '' ] )`

The method for normalizing strings can also be called on its own, without comparing the similarity of two strings. This also applies all filters and reads or writes to the cache. This can be helpful if certain strings should be saved beforehand or different normalization options want to be tested.

Parameters:

`<String> str` – string to normalize  
`<String> flags` normalization flags

Example:

```js
const cmp = new CmpStr();

console.log( cmp.normalize( '   he123LLo  ', 'nti' ) );
// Output: hello
```

### Configuration Object

An additional object with optional parameters can be passed to all comparison methods (e.g. `test`, `match`, `closest` etc.) and their asynchronous pendants. This object includes the ability to pass `flags` for normalization to all methods, as well as the `threshold` parameter for `match` and `matchAsync`.

It also contains `options` as an object of key-value pairs that are passed to the comparison algorithm. Which additional arguments an algorithm accepts depends on the function exported from the module itself. Further down in this documentation, the various parameters for each algorithm are listed.

Global config options:

`<String> flags` – normalization flags  
`<Number> threshold` – similarity threshold between 0 and 1  
`<Object> options` – options passed to the algorithm

Example:

```js
const cmp = new CmpStr( 'smithWaterman', 'alignment' );

console.log( cmp.match( [
  '  align ment', 'ali gnm ent   ', ' alIGNMent'
], {
  flags: 'it',
  threshold: 0.8,
  options: {
    mismatch: -4,
    gap: -2
  }
} ) );
// Output: [ { target: ' alIGNMent', match: 1 }, { target: '  align ment', match: 0.8... }
]
```

## Asynchronous Support

The `CmpStrAsync` class provides an asynchronous wrapper for all comparison methods as well as the string normalization function. It is ideal for large datasets or non-blocking workflows.

The asynchronous class supports the methods `normalizeAsync`, `compareAsync`, `testAsync`, `batchTestAsync`, `matchAsync`, `closestAsync` and `similarityMatrixAsync`. Each of these methods returns a `Promise`.

For options, arguments and returned values, see the documentation above.

Example:

```js
const { CmpStrAsync } = require( 'cmpstr' );

const cmp = new CmpStrAsync( 'dice', 'best' );

cmp.batchTestAsync( [
  'better', 'bestest', 'the best', 'good', ...
] ).then( console.log );
```

## Supported Algorithms

The following algorithms for similarity analysis are natively supported by the CmpStr package. Lazy-loading keeps memory consumption and loading time low, as only the algorithm intended to be used will be loaded as a module.

### Similarity Algorithms

#### Levenshtein Distance – `levenshtein`

The Levenshtein distance between two strings is the minimum number of single-character edits (i.e. insertions, deletions or substitutions) required to change one word into the other.

Options:

`<Boolean> raw` – if true the raw distance is returned

#### Damerau-Levenshtein – `damerau`

The Damerau-Levenshtein distance differs from the classical Levenshtein distance by including transpositions among its allowable operations in addition to the three classical single-character edit operations (insertions, deletions and substitutions). Useful for correcting typos.

Options:

`<Boolean> raw` – if true the raw distance is returned

#### Jaro-Winkler – `jaro`

Jaro-Winkler is a string similarity metric that gives more weight to matching characters at the start of the strings.

Options:

`<Boolean> raw` – if true the raw distance is returned

#### Cosine Similarity – `cosine`

Cosine similarity is a measure how similar two vectors are. It's often used in text analysis to compare texts based on the words they contain.

Options:

`<String> delimiter` – term delimiter

#### Dice Coefficient – `dice`

The Dice-Sørensen index equals twice the number of elements common to both sets divided by the sum of the number of elements in each set. Equivalently the index is the size of the intersection as a fraction of the average size of the two sets.

#### Jaccard Index – `jaccard`

The Jaccard Index measures the similarity between two sets by dividing the size of their intersection by the size of their union.

#### Hamming Distance – `hamming`

The Hamming distance between two equal-length strings of symbols is the number of positions at which the corresponding symbols are different.

#### Longest Common Subsequence – `lcs`

LCS measures the length of the longest subsequence common to both strings.

#### Needleman-Wunsch – `needlemanWunsch`

The Needleman-Wunsch algorithm performs global alignment, aligning two strings entirely, including gaps. It is commonly used in bioinformatics.

Options:

`<Number> match` – score for a match  
`<Number> mismatch` – penalty for a mismatch  
`<Number> gap` – penalty for a gap

#### Smith-Waterman – `smithWaterman`

The Smith-Waterman algorithm performs local alignment, finding the best matching subsequence between two strings. It is commonly used in bioinformatics.

Options:

`<Number> match` – score for a match  
`<Number> mismatch` – penalty for a mismatch  
`<Number> gap` – penalty for a gap

#### q-Gram – `qGram`

Q-gram similarity is a string-matching algorithm that compares two strings by breaking them into substrings of length Q. It's used to determine how similar the two strings are.

Options:

`<Int> q` length of substrings

### Phonetic Algorithms

#### Soundex – `soundex`

The Soundex algorithm generates a phonetic representation of a string based on how it sounds. It supports predefined setups for English and German and allows users to provide custom options.

Options:

`<String> lang` – language code for predefined setups (e.g., `en`, `de`)  
`<Boolean> raw` – if true, returns the raw sound index codes  
`<Object> mapping` – custom phonetic mapping (overrides predefined)  
`<String> exclude` – characters to exclude from the input (overrides predefined)  
`<Number> maxLength` – maximum length of the phonetic code