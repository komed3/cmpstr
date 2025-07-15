# CmpStr - Modern String Similarity Package

[![GitHub License](https://img.shields.io/github/license/komed3/cmpstr?style=for-the-badge&logo=unlicense&logoColor=fff)](LICENSE)
[![Static Badge](https://img.shields.io/badge/docs-docs?style=for-the-badge&logo=readthedocs&logoColor=fff&color=blue)](https://github.com/komed3/cmpstr/wiki)
[![Static Badge](https://img.shields.io/badge/Typescript-support?style=for-the-badge&logo=typescript&logoColor=fff&color=blue)](https://www.typescriptlang.org)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/komed3/cmpstr?style=for-the-badge&logo=npm&logoColor=fff)](https://npmjs.com/package/cmpstr)
[![Static Badge](https://img.shields.io/badge/57kB-Bundle?style=for-the-badge&logo=gitlfs&logoColor=fff&label=Bundle&color=yellow)](https://pkg-size.dev/cmpstr)
[![NPM Downloads](https://img.shields.io/npm/dy/cmpstr?style=for-the-badge&logo=transmission&logoColor=fff)](https://npmpackage.info/package/cmpstr?t=downloads)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/komed3/cmpstr/build.yml?style=for-the-badge&logo=educative&logoColor=fff)](https://github.com/komed3/cmpstr/actions/workflows/build.yml)
[![Static Badge](https://img.shields.io/badge/ESM_%26_CJS-TypeScript?style=for-the-badge&logo=nodedotjs&logoColor=fff&color=purple)](https://github.com/komed3/cmpstr/wiki/Installation-&-Setup#import-in-your-project)
[![Static Badge](https://img.shields.io/badge/UMD_%26_ESM-JavaScript?style=for-the-badge&logo=javascript&logoColor=fff&color=orange)](https://github.com/komed3/cmpstr/wiki/Installation-&-Setup#browser)

**CmpStr** is a TypeScript library for advanced string comparison, similarity measurement, phonetic indexing, and text analysis. It includes implementations of several established algorithms such as Levenshtein, Dice–Sørensen, Damerau–Levenshtein and Soundex. The library has no external dependencies and allows for the integration of custom metrics, phonetic mappings, and normalization filters.

CmpStr provides a unified API for single, batch and pairwise operations. It is suitable for a range of use cases in application development and research. The package includes support for both ESM and CommonJS environments, TypeScript type declarations and a browser-compatible JavaScript bundle.

Originally launched in 2023 with a minimal feature set, the library was redesigned in 2025 to support a broader set of algorithms and processing features. The current version offers asynchronous operation, configurable normalization and filtering pipelines, phonetic search functionality, and basic tools for string differencing.

**Key Features**

- Unified API for string similarity, distance measurement and matching
- Modular metric system with support for algorithms such as Levenshtein, Jaro-Winkler, Cosine etc.
- Integrated phonetic algorithms (e.g., Soundex, Metaphone) with configurable registry
- Normalization and filtering pipeline for consistent input processing
- Single, batch and pairwise comparisons with structured, type-safe results
- Phonetic-aware search and comparison
- Utilities for text structure and readability analysis (e.g., syllables, word statistics)
- Diffing tools with CLI-friendly formatting
- TypeScript-native with full type declarations and extensibility
- Supports asynchronous workflows for scalable, non-blocking processing
- Extensible architecture for integrating custom algorithms and filters

## Getting Started

Working with CmpStr is simple and straightforward. The package is installed just like any other using the following command:

```sh
npm install cmpstr
```

Minimal usage example:

```ts
import { CmpStr } from 'cmpstr';

const cmp = CmpStr.create().setMetric( 'levenshtein' ).setFlags( 'i' );

const result = cmp.test( [ 'hello', 'hola' ], 'Hallo' );

console.log( result );
// { source: 'hello', target: 'Hallo', match: 0.8 }
```

For asynchronous workloads:

```ts
import { CmpStrAsync } from 'cmpstr';

const cmp = CmpStrAsync.create().setProcessors( {
  phonetic: { algo: 'soundex' }
} );

const result = await cmp.searchAsync( 'Maier', [
  'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier'
] );

console.log( result );
// [ 'Meyer', 'Meier' ]
```

_Try with [OneCompiler](https://onecompiler.com/nodejs/43qr6trny)._

## CLI Tool

Try out or use CmpStr on the terminal. Install the **[cmpstr-cli](https://www.npmjs.com/package/cmpstr-cli)** package and use many features of CmpStr directly on the console via the cmpstr command. Many options and parameters also make the command suitable for scripts and automatic processing.

## Documentation

The full documentation, API reference and advanced usage examples are available in the [GitHub Wiki](https://github.com/komed3/cmpstr/wiki).

**LICENSE MIT © 2023-2025 PAUL KÖHLER (KOMED3)**