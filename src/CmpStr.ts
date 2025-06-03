'use strict';

import type {} from './utils/Types';

import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';

import { METRICS } from './metric/index';
import { PHONETICS } from './phonetic/index';

export default class CmpStr {

    public static addFilter = Filter.add;
    public static removeFilter = Filter.remove;
    public static pauseFilter = Filter.pause;
    public static resumeFilter = Filter.resume;
    public static listFilter = Filter.list;
    public static clearFilter = Filter.clear;

    protected static readonly profiler = Profiler.getInstance();

    public static profilerReport = this.profiler.getAll;
    public static profilerClear = this.profiler.clear;

};