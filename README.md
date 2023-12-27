# cmpstr

This lightweight npm package can be used to __calculate the similarity of strings__. It supports both the best known __Levenshtein distance__ and the slightly more accurate __Sørensen dice coefficient__.

## Install

Using __Node.js__, install the package with the following shell command:

```sh
npm install cmpstr
```

## Usage

Load the package into your project:

```js
const cmpstr = require( 'cmpstr' );
```

Sample of how to use the package in your code:

```js
let str1 = 'kitten';
let str2 = 'sitting';

/**
 * levenshteinDistance
 * expected: 3
 */
let distance = cmpstr.levenshteinDistance( str1, str2 );

/**
 * diceCoefficient
 * expected: 0.3636363636363636
 */
let dice = cmpstr.diceCoefficient( str1, str2 );

/**
 * diceClosest
 * expected: bestest
 */
let closest = cmpstr.diceClosest( 'best', [
  'better', 'bestest', 'well', 'good'
] );

/**
 * levenshteinMatch
 * expected: [
 *   { target: 'bestest', match: 0.5714285714285714 },
 *   { target: 'better', match: 0.5 },
 *   { target: 'well', match: 0.25 },
 *   { target: 'good', match: 0 }
 * ]
 */
let matches = cmpstr.levenshteinMatch( 'best', [
  'better', 'bestest', 'well', 'good'
] );
```

### JavaScript

Using JavaScript load this package by embed this file via [jsDelivr](https://www.jsdelivr.com/package/npm/cmpstr):

```js
import cmpstr from "https://cdn.jsdelivr.net/npm/cmpstr@1.0.3/+esm";
```

Remember: To use ``import`` you need to load your JavaScript file as ``type="module"``.

## API

The npm package ``cmpstr`` supports two different methods for determining the similarity of two strings. The __Levenshtein distance__, as the minimum number of inserting, deleting and replacing operations to convert one string into another, and the __Sørensen-Dice coefficient__ to measure the similarity of two samples.

Learn more about both by visiting these links:

* [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
* [Sørensen-Dice coefficient](https://en.wikipedia.org/wiki/Sørensen–Dice_coefficient)

### Levenshtein distance

#### ``levenshteinDistance( a, b [, flags = null ] )``

Calculates the difference between two strings ``a`` and ``b`` and returns the Levenshtein distance as an integer value.

#### ``levenshtein( a, b [, flags = null ] )``

Returns the match percentage of two strings ``a`` and ``b``. The output value is in the range ``0..1`` as a floating point number.

#### ``levenshteinClosest( str, arr [, flags = null ] )``

Returns the best match of the string ``str`` against the array ``arr`` of passed strings. The function returns the most closely matched string found in the array.

#### ``levenshteinMatch( str, arr [, flags = null [, threshold = 0 ] ] )``

Calculates the similarity of all strings contained in the array ``arr`` according to Levenshtein compared to ``str`` and returns an array of all samples sorted by matching in descending order. The ``threshold`` specifies the minimum required similarity.

### Sørensen-Dice coefficient

#### ``diceCoefficient( a, b [, flags = null ] )``

This function evaluates the similarity of two given strings ``a`` and ``b`` as percentage value according to the Sørensen-Dice coefficient and returns the result as floating point number.

#### ``diceClosest( str, arr [, flags = null ] )``

As another way to find the best match between the string ``str`` and a given array ``arr`` of samples, this function uses the Sørensen-Dice coefficient. It returns the most matching string as well.

#### ``diceMatch( str, arr [, flags = null [, threshold = 0 ] ] )``

Calculates the similarity of all strings contained in the array ``arr`` according to Sørensen-Dice coefficient compared to ``str`` and returns an array of all samples sorted by matching in descending order. The ``threshold`` specifies the minimum required similarity.

### Flags

Each method can be passed the ``flags`` options listed below:

| Flag  | Option                         |
| ----- | ------------------------------ |
| ``i`` | case insensitive               |
| ``s`` | non-whitespace characters only |

## Patch notes

### 1.0.3

* Add ``threshold`` to specify the minimum required similarity

### 1.0.2

* Add normalize options ``i`` and ``s``
* Minor fixes

### 1.0.1

* Minor fixes

### 1.0.0

* Initial release