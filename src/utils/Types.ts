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

export type MetricMode = 'default' | 'batch' | 'pairwise';

export interface MetricOptions {
    mode?: MetricMode;
    perf?: boolean;
};

export interface MetricRaw {
    dist?: number;
    intersection?: number;
    size?: number;
    [ key: string ]: any;
};

export interface MetricCompute {
    res: number;
    raw?: MetricRaw;
}

export interface MetricResultSingle {
    metric: string;
    a: string;
    b: string;
    res: number;
    raw?: MetricRaw;
    perf?: Performance;
};

export type MetricResult = MetricResultSingle | MetricResultSingle[];