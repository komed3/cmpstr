'use strict';

export type PoolType = 'uint16' | 'number[]' | 'set' | 'map';

export interface PoolConfig {
  type: PoolType;
  maxSize: number;
  maxItemSize: number;
  allowOversize: boolean;
}

export interface PoolBuffer<T> {
  buffer: T;
  size: number;
}

export type NormalizerFn = ( input: string ) => string;

export type NormalizeFlags = string;

export interface Performance {
    time: number;
    mem: number;
};

export type FilterFn = ( input: string ) => string;

export interface FilterOptions {
    priority?: number;
    active?: boolean;
    overrideable?: boolean;
};

export interface FilterEntry {
    id: string;
    fn: FilterFn;
    priority: number;
    active: boolean;
    overrideable: boolean;
}

export type MetricInput = string | string[];

export type MetricMode = 'default' | 'batch' | 'pairwise';

export interface MetricOptions {
    mode?: MetricMode;
    perf?: boolean;
    pad?: string;
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