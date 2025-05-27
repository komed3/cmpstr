# CmpStr - lightweight npm string similarity package

[![GitHub License](https://img.shields.io/github/license/komed3/cmpstr?style=for-the-badge&logo=github&logoColor=fff)](LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/komed3/cmpstr?style=for-the-badge&logo=npm&logoColor=fff)](https://npmjs.com/package/cmpstr)
[![npm bundle size](https://img.shields.io/bundlephobia/min/cmpstr?style=for-the-badge&logo=gitlfs&logoColor=fff)](https://bundlephobia.com/package/cmpstr)
[![NPM Downloads](https://img.shields.io/npm/dy/cmpstr?style=for-the-badge&logo=transmission&logoColor=fff)](https://npmpackage.info/package/cmpstr?t=downloads)


**CmpStr** is a lightweight and powerful npm package for calculating string similarity, finding the closest matches in arrays, performing phonetic searches, and much more. It supports a variety of built-in algorithms (e.g., Levenshtein, Dice-Sørensen, Damerau-Levenshtein, Soundex) and allows users to add custom algorithms and normalization filters.

Started in 2023 as a small project only supporting two algorithms, it was reworked in 2025. Today, CmpStr is written in TypeScript, supports more than 10 different algorithms, asynchronous handling, string normalization, filters, phonetic search and more.

**Key Features**

- Built-in support for multiple similarity algorithms.
- Phonetic search with language-specific configurations (e.g., Soundex).
- Batch operations and similarity matrices for large datasets.
- Customizable normalization with global flags and caching.
- Asynchronous support for non-blocking workflows.
- Extensible with custom algorithms and filters.
- TypeScript declarations for better developer experience.
- Support for both EMS and CommonJS.
- JavaScript rolled out version for browser environments.

## Getting Started

Working with CmpStr is simple and straightforward. The npm package is installed just like any other using the following command:

```sh
npm install cmpstr
```
