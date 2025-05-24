'use strict';

/**
 * Interface for metric options.
 * 
 * @interface MetricOptions
 * @property {any} [key] - Key-value pairs for metric options
 */
export interface MetricOptions {
    [ key : string ] : any;
}

/**
 * Interface for raw metric data.
 * 
 * @interface MetricRaw
 * @property {number} [dist] - Distance value
 * @property {number} [intersection] - Intersection value
 * @property {number} [union] - Union value
 * @property {any} [key] - Additional key-value pairs for raw data
 */
export interface MetricRaw {
    dist? : number;
    intersection? : number;
    union? : number;
    [ key : string ] : any;
}

/**
 * Interface for a single metric result.
 * 
 * @interface MetricSingleResult
 * @property {string} metric - Name of the metric
 * @property {string} a - First string
 * @property {string} b - Second string
 * @property {number} res - Result of the metric calculation
 * @property {MetricRaw} [raw] - Optional raw data related to the metric
 */
export interface MetricSingleResult {
    metric : string;
    a : string;
    b : string;
    res : number;
    raw? : MetricRaw;
}

/**
 * Type for a batch of metric results.
 * 
 * @type MetricBatchResult
 * @property {MetricSingleResult[]} - Array of metric results
 */ 
export type MetricBatchResult = MetricSingleResult[];

/**
 * Type for metric result(s).
 * 
 * @type MetricResult
 * @property {MetricSingleResult | MetricBatchResult} - Single or array of metric results
 */ 
export type MetricResult = MetricSingleResult | MetricBatchResult;

/**
 * Type for a metric module.
 * 
 * @function Metric
 * @param {string} a - First string
 * @param {string | string[]} b - Second string or array of strings
 * @param {MetricOptions} [options] - Optional metric options
 * @returns {MetricResult} - Result of the metric calculation
 */
export type Metric = (
    a : string,
    b : string | string[],
    options? : MetricOptions
) => MetricResult;