# CmpStr – Modern String Similarity Package

[![GitHub License](https://img.shields.io/github/license/komed3/cmpstr?style=for-the-badge\&logo=unlicense\&logoColor=fff)](LICENSE)
[![Static Badge](https://img.shields.io/badge/docs-docs?style=for-the-badge\&logo=readthedocs\&logoColor=fff\&color=blue)](https://github.com/komed3/cmpstr/wiki)
[![Static Badge](https://img.shields.io/badge/TypeScript-supported?style=for-the-badge\&logo=typescript\&logoColor=fff\&color=blue)](https://www.typescriptlang.org)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/komed3/cmpstr?style=for-the-badge\&logo=npm\&logoColor=fff)](https://npmjs.com/package/cmpstr)
[![npm bundle size](https://img.shields.io/bundlephobia/min/cmpstr?style=for-the-badge\&logo=gitlfs\&logoColor=fff)](https://bundlephobia.com/package/cmpstr)
[![NPM Downloads](https://img.shields.io/npm/dy/cmpstr?style=for-the-badge\&logo=transmission\&logoColor=fff)](https://npm-stat.com/charts.html?package=cmpstr)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/komed3/cmpstr/build.yml?style=for-the-badge\&logo=educative\&logoColor=fff)](https://github.com/komed3/cmpstr/actions/workflows/build.yml)
[![Static Badge](https://img.shields.io/badge/ESM_%26_CJS-TypeScript?style=for-the-badge\&logo=nodedotjs\&logoColor=fff\&color=purple)](https://github.com/komed3/cmpstr/wiki/Installation-&-Setup#import-in-your-project)
[![Static Badge](https://img.shields.io/badge/UMD_%26_ESM-JavaScript?style=for-the-badge\&logo=javascript\&logoColor=fff\&color=orange)](https://github.com/komed3/cmpstr/wiki/Installation-&-Setup#browser)

**CmpStr** is a modern TypeScript library for advanced string comparison, similarity measurement, phonetic indexing, and text analysis. It provides a comprehensive collection of established algorithms such as Levenshtein, Dice–Sørensen, Jaro-Winkler, LCS, q-Gram, and more.

The library is dependency-free, fully typed, and designed with extensibility in mind. Custom metrics, phonetic mappings, normalization filters, and processing pipelines can be integrated without modifying the core. CmpStr offers a unified, consistent API for single comparisons, batch processing, and pairwise matching across synchronous and asynchronous workflows.

Originally released in 2023 with a minimal feature set, CmpStr was fundamentally redesigned in 2025 to support a broader range of algorithms, scalable processing, and more demanding real-world use cases. The current version emphasizes determinism, performance, and architectural clarity while remaining approachable for everyday usage.

## Key Features

* Unified API for string similarity, distance measurement, and matching
* Modular metric system with built-in support for 11 different metrics
* Integrated phonetic algorithms (e.g. Soundex, Metaphone) with a configurable registry
* Configurable normalization and filtering pipeline for consistent input processing
* Single, batch, and pairwise comparisons with structured, type-safe results
* Phonetic-aware search and comparison
* Structured data comparison via property extraction
* Utilities for text structure and readability analysis (e.g. syllables, word statistics)
* Diffing utilities with CLI-friendly output formats
* TypeScript-native design with full type declarations
* Optional asynchronous APIs for scalable, non-blocking workloads
* Extensible architecture for custom algorithms, processors, and filters

## Getting Started

Install CmpStr using npm:

```sh
npm install cmpstr
```

### Minimal Example

```ts
import { CmpStr } from 'cmpstr';

const cmp = CmpStr.create().setMetric( 'levenshtein' ).setFlags( 'i' );
const result = cmp.test( [ 'hello', 'hola' ], 'Hallo' );

console.log( result );
// { source: 'hello', target: 'Hallo', match: 0.8 }
```

### Asynchronous Usage

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

*Try it online with [OneCompiler](https://onecompiler.com/nodejs/43qr6trny).*

## CLI Tool

CmpStr can also be used directly from the command line via **[cmpstr-cli](https://npmjs.com/package/cmpstr-cli)**. The CLI exposes many of the library’s features for interactive use, scripting, and automated processing, making it suitable for data cleaning, analysis, and batch workflows.

## Documentation

Comprehensive documentation, API references, and advanced usage examples are available in the [GitHub Wiki](https://github.com/komed3/cmpstr/wiki).

## License

MIT License © 2023–2026 Paul Köhler (komed3)
