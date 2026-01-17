/**
 * CmpStr Development Entry Point
 * src/root.ts
 * 
 * This entry point is intended for development and extension of the CmpStr library. It exposes
 * core components and utilities that allow developers to create new metrics, phonetic algorithms,
 * and other extensions to the library.
 * 
 * Please visit CmpStr's documentation for more information:
 * https://github.com/komed3/cmpstr/wiki/Extending-CmpStr
 * 
 * @version 3.1.0
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

// Export the types and interfaces for the library
export * from './utils/Types';

/**
 * Export utils to implement new metrics
 * 
 *  - MetricRegistry: Metric registry service for managing metric implementations.
 *  - Metric: Abstract class representing a generic string metric.
 *  - MetricCls: Type definition for a class constructor that extends the Metric class.
 */
export { MetricRegistry, Metric, MetricCls } from './metric';

/**
 * Export utils to implement new phonetic algorithms
 * 
 *  - PhoneticRegistry: Phonetic registry service for managing phonetic algorithm implementations.
 *  - PhoneticMappingRegistry: Registry for managing phonetic character mappings.
 *  - Phonetic: Abstract class representing a generic phonetic algorithm.
 *  - PhoneticCls: Type definition for a class constructor that extends the Phonetic class.
 */
export { PhoneticRegistry, PhoneticMappingRegistry, Phonetic, PhoneticCls } from './phonetic';

// Export additional utilities and components
export * as DeepMerge from './utils/DeepMerge';
export { Filter } from './utils/Filter';
export { HashTable } from './utils/HashTable';
export { Pool } from './utils/Pool';
export { Profiler } from './utils/Profiler';
export { StructuredData } from './utils/StructuredData';
