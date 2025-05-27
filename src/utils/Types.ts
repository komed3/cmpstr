'use strict';

export interface PoolBuffer {
    a: Uint16Array;
    b: Uint16Array;
    len: number;
    t: number;
};

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