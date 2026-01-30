/**
 * CmpStr Main Entry Point
 * src/index.ts
 * 
 * CmpStr is a comprehensive, extensible, and highly abstracted TypeScript library for
 * advanced string comparison, similarity measurement, phonetic indexing, normalization,
 * filtering, and text analysis. It is designed for both high-level application development
 * and research, offering a unified API for single, batch, and pairwise operations.
 * 
 * Version: 3.2.1
 * Author: Paul Köhler (komed3)
 * License: MIT
 * 
 * Core Features:
 * --------------
 * 
 *  - Unified interface for string similarity, distance, and matching
 *  - Pluggable metric system (Levenshtein, Jaro-Winkler, Cosine, Dice, Hamming, LCS, etc.)
 *  - Phonetic algorithms (Cologne, Soundex, Metaphone) with mapping registry
 *  - Flexible normalization and filtering pipeline for all inputs
 *  - Batch, pairwise, and single comparison with detailed, type-safe results
 *  - Safe-mode for handling empty inputs gracefully
 *  - Phonetic-aware search, indexing, and comparison
 *  - Structured data comparison by extracting properties from objects
 *  - Readability and text analysis utilities (syllables, word stats, etc.)
 *  - Unified diff and difference reporting (line/word, ASCII/CLI)
 *  - Full TypeScript type safety, extensibility, and profiling support
 *  - Modular architecture for easy integration and extension
 * 
 * Overview:
 * ---------
 * 
 * CmpStr provides a single entry point for all string comparison and analysis tasks.
 * The main class, `CmpStr`, exposes a rich API for comparing strings, arrays, or
 * batches, with full support for normalization, filtering, and phonetic processing.
 * All metric and phonetic algorithms are managed via registries, allowing for
 * dynamic extension and customization. The package also includes utilities for
 * diffing, text analysis, and profiling, making it suitable for applications such as
 * search engines, data deduplication, fuzzy matching, linguistics, and more.
 * 
 * For asynchronous workloads, use `CmpStrAsync`, which provides the same API with
 * Promise-based, non-blocking methods for large-scale or I/O-bound operations.
 * 
 * @version 3.2.1
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

// Export the types and interfaces for the library
export * from './utils/Types';

// Export the main CmpStr class and its async variant
export { CmpStr } from './CmpStr';
export { CmpStrAsync } from './CmpStrAsync';

// Export additional utilities and components
export { DiffChecker } from './utils/DiffChecker';
export { Normalizer } from './utils/Normalizer';
export { TextAnalyzer } from './utils/TextAnalyzer';
