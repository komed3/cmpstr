'use strict';

export interface Performance {
    time: number;
    mem: number;
};

export type MetricInput = string | string[];

export interface MetricOptions {
    perf?: boolean;
};

export interface MetricRaw {
    distance?: number;
    [ key: string ]: any;
};

export interface MetricResultSingle {
    metric: string;
    a: MetricInput;
    b: MetricInput;
    similarity: number;
    raw?: MetricRaw;
    perf?: Performance;
};

export type MetricResult = MetricResultSingle | MetricResultSingle[];