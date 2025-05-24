'use strict';

export interface MetricOptions {
    [ key: string ]: any
}

export interface MetricResult {
    metric : string;
    a : string;
    b : string;
    raw? : string | number;
    res : number;
}