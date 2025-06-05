'use strict';

export type PoolType = 'uint16' | 'number[]' | 'set' | 'map';

export interface PoolConfig {
  type: PoolType;
  maxSize: number;
  maxItemSize: number;
  allowOversize: boolean;
};

export interface PoolBuffer<T> {
  buffer: T;
  size: number;
};

export type NormalizerFn = ( input: string ) => string;

export type NormalizeFlags = string;

export interface ProfilerEntry<T> {
    time: number;
    mem: number;
    res: T;
    meta?: Record<string, any>;
};

export interface ProfilerService<T> {
    enable: () => void;
    disable: () => void;
    clear: () => void;
    report: () => ProfilerEntry<T>[],
    last: () => ProfilerEntry<T> | undefined,
    total: () => { time: number, mem: number };
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
};

export type RegistryConstructor<T> = abstract new ( ...args: any[] ) => T;

export interface RegistryService<T> {
    add: ( name: string, cls: RegistryConstructor<T>, update?: boolean ) => void;
    remove: ( name: string ) => void;
    has: ( name: string ) => boolean;
    get: ( name: string ) => RegistryConstructor<T>;
    list: () => string[];
};

export type MetricInput = string | string[];

export type MetricMode = 'default' | 'batch' | 'single' | 'pairwise';

export interface MetricOptions {
    mode?: MetricMode;
    removeZero?: boolean;
    delimiter?: string;
    pad?: string;
    q?: number;
    match?: number;
    mismatch?: number;
    gap?: number;
};

export type MetricRaw = Record<string, any>;

export interface MetricCompute<R = MetricRaw> {
    res: number;
    raw?: R;
};

export interface MetricResultSingle<R = MetricRaw> {
    metric: string;
    a: string;
    b: string;
    res: number;
    raw?: R;
};

export type MetricResultBatch<R = MetricRaw> = MetricResultSingle<R>[];

export type MetricResult<R = MetricRaw> = MetricResultSingle<R> | MetricResultBatch<R>;

export interface PhoneticOptions {
    map?: string;
    delimiter?: string;
    length?: number;
    pad?: string;
    dedupe?: boolean;
};

export interface PhoneticRule {
    char: string;
    code: string;
    position?: 'start' | 'middle' | 'end';
    prev?: string[]; prevNot?: string[];
    prev2?: string[]; prev2Not?: string[];
    next?: string[]; nextNot?: string[];
    next2?: string[]; next2Not?: string[];
    leading?: string; trailing?: string;
    match?: string[];
};

export interface PhoneticMap {
    map: Record<string, string>;
    ruleset?: PhoneticRule[];
    ignore?: string[];
    length?: number;
    pad?: string;
};

export type PhoneticMapping = Record<string, PhoneticMap>;

export interface PhoneticMappingService {
    add: ( algo: string, id: string, map: PhoneticMap, update?: boolean ) => void;
    remove: ( algo: string, id: string ) => void;
    has: ( algo: string, id: string ) => boolean;
    get: ( algo: string, id: string ) => PhoneticMap | undefined;
    list: ( algo: string ) => string[];
};

export type DiffMode = 'line' | 'word';

export interface DiffOptions {
    mode?: DiffMode;
    caseInsensitive?: boolean;
    contextLines?: number;
    groupedLines?: boolean;
    expandLines?: boolean;
    showChangeMagnitude?: boolean;
    maxMagnitudeSymbols?: number;
    lineBreak?: string;
};

export interface DiffEntry {
    posA: number; posB: number;
    del: string; ins: string;
    size: number;
};

export interface DiffLine {
    line: number;
    diffs: DiffEntry[];
    delSize: number;
    insSize: number;
    totalSize: number;
    baseLen: number;
    magnitude: string;
};

export interface DiffGroup {
    line: number;
    start: number;
    end: number;
    entries: DiffLine[];
    delSize: number;
    insSize: number;
    totalSize: number;
    magnitude: string;
};

export interface CmpStrOptions {
    metric?: string;
    metricOptions?: MetricOptions;
    normalizeFlags?: NormalizeFlags;
    raw?: boolean;
    phonetic?: string;
    phoneticOptions?: PhoneticOptions;
    diffOptions?: DiffOptions;
};

export interface CmpStrResult {
    target: string;
    match: number;
};