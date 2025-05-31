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

export interface ProfilerEntry<T> {
    time: number;
    mem: number;
    res: T;
    meta?: Record<string, any>;
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
    debug?: boolean;
    delimiter?: string;
    pad?: string;
    q?: number;
    match?: number;
    mismatch?: number;
    gap?: number;
    phonetic?: {
        mapping?: string;
        length?: number;
    }
};

export type MetricRaw = Record<string, any>;

export interface MetricCompute<R = MetricRaw> {
    res: number;
    raw?: R;
}

export interface MetricResultSingle<R = MetricRaw> {
    metric: string;
    a: string;
    b: string;
    res: number;
    raw?: R;
};

export type MetricResult<R = MetricRaw> = MetricResultSingle<R> | MetricResultSingle<R>[];

export interface PhoneticRule {
    char: string;
    code: string;
    position?: 'start' | 'end' | 'middle';
    prev?: string[]; prevNot?: string[];
    prev2?: string[]; prev2Not?: string[];
    next?: string[]; nextNot?: string[];
    next2?: string[]; next2Not?: string[];
    leading?: string; trailing?: string;
    match?: string[];
};

export interface PhoneticMap {
    map: Record<string, string>;
    ignore?: string[];
    rules?: PhoneticRule[]
};

export type PhoneticMapping = Record<string, PhoneticMap>;