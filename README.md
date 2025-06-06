# CmpStr - Modern String Similarity Package

[![GitHub License](https://img.shields.io/github/license/komed3/cmpstr?style=for-the-badge&logo=github&logoColor=fff)](LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/komed3/cmpstr?style=for-the-badge&logo=npm&logoColor=fff)](https://npmjs.com/package/cmpstr)
[![npm bundle size](https://img.shields.io/bundlephobia/min/cmpstr?style=for-the-badge&logo=gitlfs&logoColor=fff)](https://bundlephobia.com/package/cmpstr)
[![NPM Downloads](https://img.shields.io/npm/dy/cmpstr?style=for-the-badge&logo=transmission&logoColor=fff)](https://npmpackage.info/package/cmpstr?t=downloads)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/komed3/cmpstr/build.yml?style=for-the-badge&logo=builtbybit&logoColor=fff)](https://github.com/komed3/cmpstr/actions/workflows/build.yml)

**CmpStr** is a modern, extensible and highly abstracted TypeScript library for advanced string comparison, similarity measurement, phonetic indexing and text analysis. It is lightweight, does not need any dependencies, supports a variety of built-in algorithms (e.g., Levenshtein, Dice-Sørensen, Damerau-Levenshtein, Soundex) and allows users to add custom metrics, phonetic mappings and normalization filters.

It is designed for both high-level application development and research, offering a unified API for single, batch, and pairwise operations. The packagle bundles ESM and CommonJS support, TypeScript declarations and a JavaScript version for browser environments.

Started in 2023 as a small project only supporting two algorithms, it was reworked in 2025. Today, CmpStr is written in TypeScript, supports more than 10 different algorithms, asynchronous handling, string normalization, filters, phonetic search, comes with a simple diff tool and much more.

**Key Features**

- Unified interface for string similarity, distance, and matching
- Pluggable metric system (e.g., Levenshtein, Jaro-Winkler, Cosine, Dice, Hamming)
- Phonetic algorithms (Cologne, Soundex, Metaphone) with mapping registry
- Flexible normalization and filtering pipeline for all inputs
- Batch, pairwise, and single comparison with detailed, type-safe results
- Phonetic-aware search and indexing
- Readability and text analysis utilities (syllables, word stats, etc.)
- Unified diff and difference reporting (line/word, ASCII/CLI)
- Full TypeScript type safety, extensibility, and profiling support
- Modular architecture for easy integration and extension
- Asynchronous API for non-blocking, scalable workloads
- Extensible with custom algorithms and filters

## Getting Started

Working with CmpStr is simple and straightforward. The package is installed just like any other using the following command:

```sh
npm install cmpstr
```

Minimal usage example:

```js
import { CmpStr } from 'cmpstr';

const cmp = new CmpStr ( [ 'hello', 'hola' ], 'levenshtein', {
  normalizeFlags: 'i'
} );

const result = cmp.test( 'Hallo' );
console.log( result ); // { target: 'hallo', match: 0.8 }
```

For asynchronous workloads:

```js
import { CmpStrAsync } from 'cmpstr';

const cmp = new CmpStrAsync ( [
  'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier'
] ).setPhonetic( 'soundex' );

const result = await cmp.phoneticSearchAsync( 'Maier' );
console.log( result ); // [ 'Meyer', 'Meier' ]
```