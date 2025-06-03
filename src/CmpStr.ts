'use strict';

import type {} from './utils/Types';

import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';

import { MetricRegistry } from './metric';
import { PhoneticRegistry } from './phonetic';

export default class CmpStr {

    public static addFilter = Filter.add;
    public static removeFilter = Filter.remove;
    public static pauseFilter = Filter.pause;
    public static resumeFilter = Filter.resume;
    public static listFilter = Filter.list;
    public static clearFilter = Filter.clear;

    public static addMetric = MetricRegistry.add;
    public static removeMetric = MetricRegistry.remove;
    public static hasMetric = MetricRegistry.has;
    public static listMetric = MetricRegistry.list;

    public static addPhonetic = PhoneticRegistry.add;
    public static removePhonetic = PhoneticRegistry.remove;
    public static hasPhonetic = PhoneticRegistry.has;
    public static listPhonetic = PhoneticRegistry.list;

    protected static readonly profiler = Profiler.getInstance();

    public static profilerReport = this.profiler.getAll;
    public static profilerClear = this.profiler.clear;

};