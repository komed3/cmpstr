# CmpStr – Modern String Similarity Package

[![Static Badge](https://img.shields.io/badge/docs-docs?style=for-the-badge\&logo=readthedocs\&logoColor=fff\&color=blue)](https://github.com/komed3/cmpstr/wiki)
[![Static Badge](https://img.shields.io/badge/dev_docs-dev_docs?style=for-the-badge&logo=typescript&logoColor=fff&color=blue)](https://komed3.github.io/cmpstr)
[![NPM License](https://img.shields.io/npm/l/cmpstr?style=for-the-badge&logo=unlicense&logoColor=fff)](https://github.com/komed3/cmpstr/blob/master/LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/komed3/cmpstr?style=for-the-badge\&logo=npm\&logoColor=fff)](https://npmjs.com/package/cmpstr)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/komed3/cmpstr/build.yml?style=for-the-badge\&logo=educative\&logoColor=fff)](https://github.com/komed3/cmpstr/actions/workflows/build.yml)
[![NPM Downloads](https://img.shields.io/npm/dy/cmpstr?style=for-the-badge\&logo=transmission\&logoColor=fff)](https://npm-stat.com/charts.html?package=cmpstr)
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hy/cmpstr?style=for-the-badge&logo=jsdelivr&logoColor=fff)](https://jsdelivr.com/package/npm/cmpstr)
[![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/cmpstr?format=min&style=for-the-badge&logo=gitlfs&logoColor=fff)](https://bundlephobia.com/package/cmpstr)
[![Static Badge](https://img.shields.io/badge/ESM_%26_CJS-TypeScript?style=for-the-badge\&logo=nodedotjs\&logoColor=fff\&color=purple)](https://github.com/komed3/cmpstr/wiki/Installation-&-Setup#import-in-your-project)
[![Static Badge](https://img.shields.io/badge/UMD_%26_ESM-JavaScript?style=for-the-badge\&logo=javascript\&logoColor=fff\&color=orange)](https://github.com/komed3/cmpstr/wiki/Installation-&-Setup#browser)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/W7W21SQV2Q)

**CmpStr** is a modern TypeScript library for [advanced string comparison](https://github.com/komed3/cmpstr/wiki/Comparison-Modes), [similarity measurement](https://github.com/komed3/cmpstr/wiki/Similarity-Metrics), [phonetic indexing](https://github.com/komed3/cmpstr/wiki/Phonetic-Algorithms), and [text analysis](https://github.com/komed3/cmpstr/wiki/Diff-&-Text-Analysis). It provides a comprehensive collection of established algorithms such as Levenshtein, Dice–Sørensen, Jaro-Winkler, LCS, q-Gram, and more.

The library is dependency-free, fully typed, and designed with [extensibility](https://github.com/komed3/cmpstr/wiki/Extending-CmpStr) in mind. Custom metrics, phonetic mappings, [normalization filters, and processing pipelines](https://github.com/komed3/cmpstr/wiki/Normalization-&-Filtering) can be integrated without modifying the core. CmpStr offers a [unified, consistent API](https://github.com/komed3/cmpstr/wiki/API-Reference) for single comparisons, batch processing, and pairwise matching across synchronous and [asynchronous workflows](https://github.com/komed3/cmpstr/wiki/Asynchronous-API).

Originally released in 2023 with a minimal feature set, CmpStr was [fundamentally redesigned in 2025](https://github.com/komed3/cmpstr/wiki/Changelog) to support a broader range of algorithms, scalable processing, and more demanding real-world use cases.

## Key Features

* [Unified API](https://github.com/komed3/cmpstr/wiki/API-Reference) for string similarity, distance measurement, and matching
* Modular metric system with [built-in support for 11 different metrics](https://github.com/komed3/cmpstr/wiki/Similarity-Metrics)
* Integrated [phonetic algorithms](https://github.com/komed3/cmpstr/wiki/Phonetic-Algorithms) (e.g. Soundex, Metaphone) with a configurable registry
* Configurable [normalization and filtering pipeline](https://github.com/komed3/cmpstr/wiki/Normalization-&-Filtering) for consistent input processing
* [Single, batch, and pairwise comparisons](https://github.com/komed3/cmpstr/wiki/Comparison-Modes) with structured, type-safe results
* [Structured data comparison](https://github.com/komed3/cmpstr/wiki/Structured-Data) via property extraction
* Utilities for [text structure and readability analysis](https://github.com/komed3/cmpstr/wiki/Diff-&-Text-Analysis) (e.g. syllables, word statistics)
* Diffing utilities with CLI-friendly output formats
* TypeScript-native design with full type declarations
* Optional [asynchronous API](https://github.com/komed3/cmpstr/wiki/Asynchronous-API) for scalable, non-blocking workloads
* [Extensible architecture](https://github.com/komed3/cmpstr/wiki/Extending-CmpStr) for custom algorithms, processors, and filters

## Getting Started

Install CmpStr using npm:

```sh
npm install cmpstr
```

or with yarn:

```sh
yarn add cmpstr
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

Check out the [technical documentation](https://komed3.github.io/cmpstr) created with TypeDoc, which exposes all classes, methods and types.

## License

[MIT License](https://github.com/komed3/cmpstr/blob/master/LICENSE) — © 2023–2026 Paul Köhler (komed3)
