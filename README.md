# CmpStr v2.0

`CmpStr` is a lightweight and powerful npm package for calculating string similarity, finding the closest matches in arrays, performing phonetic searches, and more. It supports a variety of built-in algorithms (e.g., Levenshtein, Dice-Sørensen, Damerau-Levenshtein, Soundex) and allows users to add custom algorithms and normalization filters.

### Key Features

- Built-in support for multiple similarity algorithms.
- Phonetic search with language-specific configurations (e.g., Soundex).
- Batch operations and similarity matrices for large datasets.
- Customizable normalization with global flags and caching.
- Asynchronous support for non-blocking workflows.
- Extensible with custom algorithms and filters.

## Supported Algorithms

### Similarity Algorithms

- **Levenshtein Distance** Measures the minimum number of edits required to transform one string into another.
- **Damerau-Levenshtein** Extends Levenshtein by including transpositions.
- **Jaro-Winkler** Measures similarity with a focus on matching prefixes.
- **Cosine Similarity** Measures the cosine of the angle between two vectors.
- **Dice Coefficient** Measures the overlap between two sets.
- **Jaccard Index** Measures the intersection over the union of two sets.
- **Hamming Distance** Measures the number of differing characters (for equal-length strings).
- **Longest Common Subsequence (LCS)** Finds the longest subsequence common to both strings.
- **Needleman-Wunsch** Global alignment algorithm.
- **Smith-Waterman** Local alignment algorithm.
- **q-Gram** Measures similarity based on overlapping substrings.

### Phonetic Algorithms

- **Soundex** Generates a phonetic representation of a string. Supports language-specific configurations (e.g., English, German).

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

console.log( cmp.test( 'Rupert', { options: { raw: true } } ) );
// Output: { a: 'R163', b: 'R163' }
```

## Methods

Creating a new instance of `CmpStr` or `CmpStrAsync` allows passing the algorithm to be used and the base string as optional arguments. Alternatively or later in the process, the `setAlgo` and `setStr` methods can be used for this purpose.

#### ``isReady()``

Checks whether string and algorithm are set correctly. Returns `true`, if the class is ready to perform similarity checks, false otherwise.

#### ``setStr( str )``

Sets the base string for comparison.

Parameters:

- `<String> str` string to set as the base

#### ``setFlags( [ flags = '' ] )``

Set default normalization flags. They will be overwritten by passing `flags` through the configuration object. See description of available flags / normalization options below in the documentation.

Parameters:

- `<String> flags` normalization flags

#### ``clearCache()``

Clears the normalization cache.

### Algorithms

#### ``listAlgo()``

List all registered similarity algorithms.

#### ``isAlgo( algo )``

Checks if an algorithm is registered. Returns `true` if so, `false` otherwise.

Parameters:

- `<String> algo` name of the algorithm

#### ``setAlgo( algo )``

Sets the current algorithm to use for similarity calculations.

Allowed options for build-in althorithms are `cosine`, `damerau`, `dice`, `hamming`, `jaccard`, `jaro`, `lcs`, `levenshtein`, `needlemanWunsch`, `qGram`, `smithWaterman` and `soundex`.

Parameters:

- `<String> algo` name of the algorithm

#### ``addAlgo( algo, callback [, useIt = true ] )``

Adding a new similarity algorithm by using the `addAlgo()` method passing the name and a callback function, that must accept at least two strings and return a number. If `useIt` is `true`, the new algorithm will automatically be set as the current one.

Parameters:

- `<String> algo` name of the algorithm
- `<Function> callback` callback function implementing the algorithm
- `<Boolean> useIt` whether to set this algorithm as the current one

Example:

```js
const cmp = new CmpStr();

cmp.addAlgo( 'customAlgo', ( a, b ) => {
  return a === b ? 1 : 0;
} );

console.log( cmp.compare( 'customAlgo', 'hello', 'hello' ) );
// Output: 1
```

#### ``rmvAlgo( algo )``

Removing a registered similarity algorithm.

Parameters:

- `<String> algo` name of the algorithm

### Filters

#### ``addFilter( name, callback [, priority = 10 ] )``

Adds a custom normalization filter. Needs to be passed a unique name and callback function accepting a string and returns a normalized one. Prioritizing filters by setting higher priority (default is `10`).

Parameters:

- `<String> name` filter name
- `<Function> callback` callback function implementing the filter
- `<Number> priority` priority of the filter

Example:

```js
const cmp = new CmpStr();

cmp.addFilter( 'prefix', ( str ) => `prefix_${str}` );
```

#### ``rmvFilter( name )``

Removes a custom normalization filter.

Parameters:

- `<String> name` filter name

#### ``pauseFilter( name )``

Pauses a custom normalization filter.

Parameters:

- `<String> name` filter name

#### ``resumeFilter( name )``

Resumes a custom normalization filter.

Parameters:

- `<String> name` filter name

#### ``clearFilter( name )``

Clears normalization filters (removing all of them).

### Similarity Comparison

#### ``compare( algo, a, b [, config = {} ] )``

Compares two strings using the specified algorithm. The method returns either the similarity score as a floating point number between 0 and 1 or raw output, if the algorithm supports it and the user passes `raw=true` through the config options.

Parameters:

- `<String> algo` name of the algorithm
- `<String> a` first string
- `<String> b` second string
- `<Object> config` configuration object

Example:

```js
const cmp = new CmpStr();

console.log( cmp.compare( 'levenshtein', 'hello', 'hallo' ) );
// Output: 0.8
```

#### ``test( str [, config = {} ] )``

Tests the similarity between the base string and a given target string. Returns the same as ``compare``.

Parameters:

- `<String> str` target string
- `<Object> config` configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.test( 'hallo' ) );
// Output: 0.8
```

#### ``batchTest( arr [, config = {} ] )``

Tests the similarity of multiple strings against the base string. Returns an array of objects with the target string and either the similarity score as a floating point number between 0 and 1 or raw output, if the algorithm supports it and the user passes `raw=true` through the config options.

Parameters:

- `<String[]> arr` array of strings
- `<Object> config` configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.batchTest( [ 'hallo', 'hola', 'hey' ] ) );
// Output: [ { target: 'hallo', match: 0.8 }, { target: 'hola', match: 0.4 }, { target: 'hey', match: 0.4 } ]
```

#### ``match( arr [, config = {} ] )``

Finds strings in an array that exceed a similarity threshold and sorts them by highest similarity. Returns an array of objects contain target string and similarity score as a floating point number between 0 and 1.

Parameters:

- `<String[]> arr` array of strings
- `<Object> config` configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.batchTest( [ 'hallo', 'hola', 'hey' ], {
  threshold: 0.5
} ) );
// Output: [ { target: 'hallo', match: 0.8 } ]
```

#### ``closest( arr [, config = {} ] )``

Finds the closest matching string from an array and returns them.

Parameters:

- `<String[]> arr` array of strings
- `<Object> config` configuration object

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.batchTest( [ 'hallo', 'hola', 'hey' ] ) );
// Output: 'hallo'
```

#### ``similarityMatrix( algo, arr [, config = {} ] )``

Generates a similarity matrix for an array of strings. Returns an 2D array that represents the similarity matrix by floating point numbers between 0 and 1.

Parameters:

- `<String> algo` name of the algorithm
- `<String[]> arr` array of strings
- `<Object> config` configuration object

Example:

```js
const cmp = new CmpStr();

console.log( cmp.similarityMatrix( 'levenshtein', [
  'hello', 'hallo', 'hola'
] ) );
// Output: [ [ 1, 0.8, 0.4 ], [ 0.8, 1, 0.4 ], [ 0.4, 0.4, 1 ] ]
```

## Normalization

The `CmpStr` package allows strings to be normalized before the similarity comparison. Options listed below are available for this and can either be set globally via `setFlags` or passed using the config object, which will overwrite the global flags. Flags are passed as a chained string in any order. For improved performance, normalized strings are stored in the cache, which can be freed using the `clearCache` method. Modifying custom filters automatically deletes the cache.

Supported flags:

- `s` remove special chars
- `w` collapse whitespaces
- `r` remove repeated chars
- `k` keep only letters
- `n` ignore numbers
- `t` trim whitespaces
- `i` case insensitivity
- `d` decompose unicode
- `u` normalize unicode

Example:

```js
const cmp = new CmpStr( 'levenshtein', 'hello' );

console.log( cmp.test( '   he123LLo  ', { flags: 'nti' } ) );
// Output: 1
```

## Asynchronous Support

The `CmpStrAsync` class provides asynchronous versions of all comparison methods. It is ideal for large datasets or non-blocking workflows.

The asynchronous class supports the methods `compareAsync`, `testAsync`, `batchTestAsync`, `matchAsync`, `closestAsync` and `similarityMatrixAsync`. Each of these methods returns a `Promise`.

For options, arguments and returned values, see the documentation above.

Example:

```js
const { CmpStrAsync } = require( 'cmpstr' );

const cmp = new CmpStrAsync( 'dice', 'best' );

cmp.batchTestAsync( [
  'better', 'bestest', 'the best', 'good', ...
] ).then( console.log );
```