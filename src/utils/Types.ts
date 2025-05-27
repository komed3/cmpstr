/**
 * Type Definitions
 * src/utils/Types.ts
 * 
 * This file contains all shared type and interface definitions used throughout
 * the CmpStr package. These types ensure type safety, code clarity, and
 * consistent data structures for all algorithms, utilities, and results.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 3.0.0
 */

'use strict';

/**
 * PoolBuffer
 * Structure for a buffer object used in the Pool utility.
 * Contains two Uint16Array buffers (a, b), their length, and a timestamp
 * for LRU management.
 */
export interface PoolBuffer {
    a: Uint16Array; // First buffer (e.g., previous row)
    b: Uint16Array; // Second buffer (e.g., current row)
    len: number;    // Length of the buffers
    t: number;      // Timestamp for least-recently-used replacement
};

/**
 * Performance
 * Structure for performance measurement results.
 * Contains elapsed time in milliseconds and memory usage in bytes.
 */
export interface Performance {
    time: number; // Elapsed time in milliseconds
    mem: number;  // Memory usage in bytes
};

/**
 * MetricInput
 * Type for input to metric functions: a single string or an
 * array of strings.
 */
export type MetricInput = string | string[];

/**
 * MetricOptions
 * Options object for metric functions.
 */
export interface MetricOptions {
    perf?: boolean; // Enable performance measurement
};

/**
 * MetricRaw
 * Structure for raw algorithm-specific data.
 * Contains additional fields like the distance of two strings.
 */
export interface MetricRaw {
    distance?: number; // The computed distance (if applicable)
    [ key: string ]: any; // Additional algorithm-specific fields
};

/**
 * MetricResultSingle
 * Structure for a single metric result.
 * Contains the metric name, input strings, similarity score, raw data
 * and optional performance data.
 */
export interface MetricResultSingle {
    metric: string;         // Name of the metric (e.g., 'levenshtein')
    a: MetricInput;         // First input string or array
    b: MetricInput;         // Second input string or array
    similarity: number;     // Normalized similarity score (0..1)
    raw?: MetricRaw;        // Raw algorithm-specific data
    perf?: Performance;     // Optional performance data
};

/**
 * MetricResult
 * Type for the result of a metric function: either a single result or
 * an array of results (for batch processing).
 */
export type MetricResult = MetricResultSingle | MetricResultSingle[];