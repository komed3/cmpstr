'use strict';

export interface MetricResult {
    metric: string;
    a: string;
    b: string;
    raw?: string | number;
    res: number;
}