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
 * Interface for metric result.
 * 
 * @interface MetricResult
 * @property {string} metric - Name of the metric
 * @property {string} a - First string
 * @property {string} b - Second string
 * @property {number} res - Result of the metric calculation
 * @property {MetricRaw} [raw] - Optional raw data related to the metric
 */
export interface MetricResult {
    metric : string;
    a : string;
    b : string;
    res : number;
    raw? : MetricRaw;
}