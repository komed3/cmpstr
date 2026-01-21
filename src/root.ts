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
 * @version 3.1.1
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

// Include the main CmpStr exports
export * from './index';

/**
 * Export utils to implement new metrics
 * 
 *  - Metric: Abstract class representing a generic string metric.
 *  - MetricCls: Type definition for a class constructor that extends the Metric class.
 *  - MetricRegistry: Metric registry service for managing metric implementations.
 */
export { Metric, MetricCls, MetricRegistry } from './metric';

/**
 * Export utils to implement new phonetic algorithms
 * 
 *  - Phonetic: Abstract class representing a generic phonetic algorithm.
 *  - PhoneticCls: Type definition for a class constructor that extends the Phonetic class.
 *  - PhoneticMappingRegistry: Registry for managing phonetic character mappings.
 *  - PhoneticRegistry: Phonetic registry service for managing phonetic algorithm implementations.
 */
export { Phonetic, PhoneticCls, PhoneticMappingRegistry, PhoneticRegistry } from './phonetic';

// Export additional utilities and components
export * as DeepMerge from './utils/DeepMerge';
export { Filter } from './utils/Filter';
export { Hasher, HashTable } from './utils/HashTable';
export { Pool } from './utils/Pool';
export { Profiler } from './utils/Profiler';
export { StructuredData } from './utils/StructuredData';
