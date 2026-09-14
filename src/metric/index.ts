/**
 * Metric Registry Loader
 * src/metric/index.ts
 * 
 * This module serves as the central loader and registry for all string similarity metrics
 * available in the CmpStr library. It ensures that all metric implementations are
 * registered with the MetricRegistry and available for use throughout the application.
 * 
 * Each metric algorithm (such as Levenshtein, Jaccard, Dice-Sørensen, etc.) is defined
 * in its own module and is automatically registered with the MetricRegistry upon import.
 * This design allows for easy extensibility: new metrics can be added simply by creating
 * a new module and importing it here. The registry pattern enables dynamic lookup,
 * instantiation, and management of all available metrics at runtime.
 * 
 * Features:
 *  - Centralized registration of all built-in string similarity metrics
 *  - Automatic registration via side-effect imports
 *  - Extensible: custom metrics can be registered at runtime via the MetricRegistry API
 *  - Consistent interface for accessing, listing, and managing metrics
 *  - Ensures that all metrics are available for use in the CmpStr API and utilities
 * 
 * Native implemented metrics are highly optimized for performance and efficiency,
 * providing fast and reliable string similarity calculations. They will use CmpStr's
 * pooling system to manage resources effectively, ensuring minimal overhead
 * and maximum performance.
 *
 * @module Metric
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';


// Export all built-in metrics and their types
// Side-effect: Each metric registers itself in the registry
export * from './Cosine';
export * from './DamerauLevenshtein';
export * from './DiceSorensen';
export * from './Hamming';
export * from './Jaccard';
export * from './JaroWinkler';
export * from './LCS';
export * from './Levenshtein';
export * from './NeedlemanWunsch';
export * from './QGram';
export * from './SmithWaterman';


// Export the Metric classes and registry
export * from './Metric';
