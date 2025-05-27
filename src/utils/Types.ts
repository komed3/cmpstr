'use strict';

export type MetricInput = string | string[];

export interface MetricResult {
    metric : string;
    a : MetricInput;
    b : MetricInput;
    similarity : number;
    raw : Record<string, any>;
};