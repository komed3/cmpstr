/**
 * Types and Interfaces for CmpStr
 * src/utils/Types.ts
 * 
 * This file defines all core types, interfaces, and utility type aliases used throughout
 * the CmpStr package. It provides type safety and documentation for all major components,
 * including metrics, phonetic algorithms, filters, normalization, diffing, and profiling.
 * All interfaces are designed for extensibility and clarity, supporting both internal
 * implementation and external usage in user code.
 * 
 * @module Utils/Types
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * ProfilerEntry represents a single profiling result, including execution time,
 * memory usage, the result of the profiled function, and optional metadata.
 * 
 * @template T - The type of the profiled result
 */
export interface ProfilerEntry<T> {
    // Execution time in milliseconds
    time: number;
    // Memory usage in bytes
    mem: number;
    // The result returned by the profiled function
    res: T;
    // Optional metadata associated with this entry
    meta?: Record<string, any>;
};

/**
 * ProfilerService defines the API for the Profiler utility, providing methods
 * to enable/disable profiling, clear results, retrieve reports, and get totals.
 * 
 * @template T - The type of the profiled result
 */
export interface ProfilerService<T> {
    // Enables the profiler
    enable: () => void;
    // Disables the profiler
    disable: () => void;
    // Clears all profiling entries
    clear: () => void;
    // Returns all profiling entries as an array
    report: () => ProfilerEntry<T>[];
    // Returns the last profiling entry, if any
    last: () => ProfilerEntry<T> | undefined;
    // Returns the total time and memory usage
    total: () => { time: number, mem: number };
};

/**
 * PoolType enumerates the supported buffer types for the Pool utility.
 */
export type PoolType = 'uint16' | 'number[]' | 'set' | 'map';

/**
 * PoolConfig defines the configuration for a buffer pool.
 */
export interface PoolConfig {
    // The type of buffer managed by the pool
    type: PoolType;
    // Maximum number of buffers in the pool
    maxSize: number;
    // Maximum allowed size for a single buffer
    maxItemSize: number;
    // Whether to allow allocation of buffers larger than maxItemSize
    allowOversize: boolean;
};

/**
 * PoolBuffer represents a buffer and its size in the pool.
 * 
 * @template T - The buffer type
 */
export interface PoolBuffer<T> {
    // The buffer instance
    buffer: T;
    // The size of the buffer
    size: number;
};

/**
 * NormalizerFn defines the signature for a normalization function.
 * It takes a string and returns a normalized string.
 */
export type NormalizerFn = ( input: string ) => string;

/**
 * NormalizeFlags is a string representing a sequence of normalization steps.
 * Each character or substring corresponds to a specific normalization operation.
 */
export type NormalizeFlags = string;

/**
 * FilterFn defines the signature for a filter function.
 * It takes a string and returns the filtered string.
 */
export type FilterFn = ( input: string ) => string;

/**
 * FilterOptions configures the behavior of a filter entry.
 */
export interface FilterOptions {
    // Priority for filter execution order (lower runs first)
    priority?: number;
    // Whether the filter is currently active
    active?: boolean;
    // Whether the filter can be overridden by another filter
    overrideable?: boolean;
};

/**
 * FilterEntry represents a single filter in the filter system.
 */
export interface FilterEntry {
    // Unique identifier for the filter
    id: string;
    // The filter function
    fn: FilterFn;
    // Execution priority
    priority: number;
    // Whether the filter is active
    active: boolean;
    // Whether the filter is overrideable
    overrideable: boolean;
};

/**
 * RegistryConstructor is a type alias for a class constructor used in registries.
 * 
 * @template T - The class type
 */
export type RegistryConstructor<T> = abstract new ( ...args: any[] ) => T;

/**
 * RegistryService defines the API for a generic registry of classes.
 * 
 * @template T - The class type managed by the registry
 */
export interface RegistryService<T> {
    // Adds a class to the registry
    add: ( name: string, cls: RegistryConstructor<T>, update?: boolean ) => void;
    // Removes a class from the registry by name
    remove: ( name: string ) => void;
    // Checks if a class exists in the registry
    has: ( name: string ) => boolean;
    // Retrieves a class constructor by name
    get: ( name: string ) => RegistryConstructor<T>;
    // Lists all registered class names
    list: () => string[];
};

/**
 * MetricInput represents the input for metric computations.
 * It can be a single string or an array of strings.
 */
export type MetricInput = string | string[];

/**
 * MetricMode specifies the computation mode for metrics.
 *  - 'default': single or batch comparison related to input
 *  - 'batch': compare multiple strings
 *  - 'single': runs a single comparison
 *  - 'pairwise': compare arrays element-wise
 */
export type MetricMode = 'default' | 'batch' | 'single' | 'pairwise';

/**
 * MetricOptions configures the behavior of metric computations.
 */
export interface MetricOptions {
    // The computation mode
    mode?: MetricMode;
    // Remove zero results from batch output
    removeZero?: boolean;
    // Delimiter for tokenization (if applicable)
    delimiter?: string;
    // Padding character for alignment algorithms
    pad?: string;
    // q-gram length for q-gram metrics
    q?: number;
    // Match score for alignment metrics
    match?: number;
    // Mismatch penalty for alignment metrics
    mismatch?: number;
    // Gap penalty for alignment metrics
    gap?: number;
};

/**
 * MetricRaw is a generic record for storing raw metric-specific data.
 */
export type MetricRaw = Record<string, any>;

/**
 * MetricCompute represents the result of a metric computation.
 * 
 * @template R - The type of the raw result
 */
export interface MetricCompute<R = MetricRaw> {
    // The normalized similarity score (0..1)
    res: number;
    // Optional raw metric-specific data
    raw?: R;
};

/**
 * MetricResultSingle represents the result of a single metric comparison.
 * 
 * @template R - The type of the raw result
 */
export interface MetricResultSingle<R = MetricRaw> {
    // The metric algorithm name
    metric: string;
    // The source string
    a: string;
    // The target string
    b: string;
    // The normalized similarity score (0..1)
    res: number;
    // Optional raw metric-specific data
    raw?: R;
};

/**
 * MetricResultBatch is an array of single metric results for batch operations.
 * 
 * @template R - The type of the raw result
 */
export type MetricResultBatch<R = MetricRaw> = MetricResultSingle<R>[];

/**
 * MetricResult is a union of single and batch metric results.
 * 
 * @template R - The type of the raw result
 */
export type MetricResult<R = MetricRaw> = MetricResultSingle<R> | MetricResultBatch<R>;

/**
 * PhoneticOptions configures the behavior of phonetic algorithms.
 */
export interface PhoneticOptions {
    // Mapping identifier
    map?: string;
    // Delimiter for splitting input
    delimiter?: string;
    // Fixed length for phonetic codes
    length?: number;
    // Padding character for codes
    pad?: string;
    // Whether to deduplicate codes
    dedupe?: boolean;
};

/**
 * PhoneticRule defines a single rule for phonetic mapping.
 */
export interface PhoneticRule {
    // The character to match
    char: string;
    // The code to assign
    code: string;
    // Position in the word (start, middle, end)
    position?: 'start' | 'middle' | 'end';
    // Previous character(s) required
    prev?: string[]; prevNot?: string[];
    // Two characters before required
    prev2?: string[]; prev2Not?: string[];
    // Next character(s) required
    next?: string[]; nextNot?: string[];
    // Two characters after required
    next2?: string[]; next2Not?: string[];
    // Leading substring required
    leading?: string;
    // Trailing substring required
    trailing?: string;
    // Additional match patterns
    match?: string[];
};

/**
 * PhoneticMap defines a mapping for a specific phonetic algorithm and language.
 */
export interface PhoneticMap {
    // Character-to-code mapping
    map: Record<string, string>;
    // Optional set of phonetic rules
    ruleset?: PhoneticRule[];
    // Characters to ignore
    ignore?: string[];
};

/**
 * PhoneticMapping is a record of named phonetic maps for an algorithm.
 */
export type PhoneticMapping = Record<string, PhoneticMap>;

/**
 * PhoneticMappingService defines the API for managing phonetic mappings.
 */
export interface PhoneticMappingService {
    // Adds a phonetic mapping for an algorithm and ID
    add: ( algo: string, id: string, map: PhoneticMap, update?: boolean ) => void;
    // Removes a phonetic mapping by algorithm and ID
    remove: ( algo: string, id: string ) => void;
    // Checks if a mapping exists for algorithm and ID
    has: ( algo: string, id: string ) => boolean;
    // Retrieves a phonetic map by algorithm and ID
    get: ( algo: string, id: string ) => PhoneticMap | undefined;
    // Lists all mapping IDs for an algorithm
    list: ( algo: string ) => string[];
};

/**
 * DiffMode specifies the granularity for diffing.
 *  - 'line': line-based diff
 *  - 'word': word-based diff
 */
export type DiffMode = 'line' | 'word';

/**
 * DiffOptions configures the behavior of the DiffChecker utility.
 */
export interface DiffOptions {
    // Diff granularity: 'line' or 'word'
    mode?: DiffMode;
    // Whether to ignore case
    caseInsensitive?: boolean;
    // Number of context lines to include
    contextLines?: number;
    // Whether to group adjacent changes
    groupedLines?: boolean;
    // Whether to expand all lines
    expandLines?: boolean;
    // Show change magnitude in output
    showChangeMagnitude?: boolean;
    // Maximum number of magnitude symbols
    maxMagnitudeSymbols?: number;
    // Line break character(s) for output
    lineBreak?: string;
};

/**
 * DiffEntry represents a single change (insertion or deletion) in a diff.
 */
export interface DiffEntry {
    // Position in the original text
    posA: number;
    // Position in the modified text
    posB: number;
    // Deleted string
    del: string;
    // Inserted string
    ins: string;
    // Size difference (ins.length - del.length)
    size: number;
};

/**
 * DiffLine represents the diff for a single line, including all changes.
 */
export interface DiffLine {
    // Line number
    line: number;
    // Array of diff entries for this line
    diffs: DiffEntry[];
    // Total deleted characters
    delSize: number;
    // Total inserted characters
    insSize: number;
    // Total size difference
    totalSize: number;
    // Base length for normalization
    baseLen: number;
    // Magnitude string (e.g., `++-`)
    magnitude: string;
};

/**
 * DiffGroup represents a group of adjacent changed lines in a diff.
 */
export interface DiffGroup {
    // Line number of the first changed line
    line: number;
    // Start line of the group
    start: number;
    // End line of the group
    end: number;
    // Array of DiffLine entries in this group
    entries: DiffLine[];
    // Total deleted characters in the group
    delSize: number;
    // Total inserted characters in the group
    insSize: number;
    // Total size difference in the group
    totalSize: number;
    // Magnitude string for the group
    magnitude: string;
};

/**
 * CmpStrProcessors defines pre-processors for input strings before comparison.
 */
export interface CmpStrProcessors {
    // Phonetic indexing
    phonetic?: {
        // Phonetic algorithm name
        algo: string;
        // Options for the phonetic algorithm
        opt?: PhoneticOptions;
    };
};

/**
 * CmpStrOptions configures the behavior of a CmpStr instance.
 */
export interface CmpStrOptions {
    // Whether to return raw metric results
    raw?: boolean;
    // Normalization flags
    flags?: NormalizeFlags;
    // Metric algorithm name
    metric?: string;
    // Options for the metric algorithm
    opt?: MetricOptions;
    // Pre-processors for input preparation
    processors?: CmpStrProcessors;
};

/**
 * CmpStrParams provides additional parameters for comparison methods.
 */
export interface CmpStrParams {
    // Normalization flags
    flags?: NormalizeFlags;
    // Metric options
    opt?: MetricOptions;
    // Whether to return raw results
    raw?: boolean;
    // Metric algorithm name
    metric?: string;
    // Source input override
    source?: MetricInput;
};

/**
 * CmpStrPhoneticParams provides additional parameters for phonetic methods.
 */
export interface CmpStrPhoneticParams {
    // Normalization flags
    flags?: NormalizeFlags;
    // Phonetic options
    opt?: PhoneticOptions;
    // Phonetic algorithm name override
    algo?: string;
};

/**
 * CmpStrResult represents a simplified result for user-facing API methods.
 */
export interface CmpStrResult {
    // The source string
    source: string;
    // The target string
    target: string;
    // The similarity score (0..1)
    match: number;
};