'use strict';

import type {
    MetricInput, MetricOptions, MetricRaw, PhoneticOptions
} from './utils/Types';

import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';

import { createFromRegistry } from './utils/Registry';
import { MetricRegistry, MetricCls, Metric } from './metric';
import { PhoneticRegistry, PhoneticMappingRegistry, PhoneticCls, Phonetic } from './phonetic';

const profiler = Profiler.getInstance();

export class CmpStr<R = MetricRaw> {

    private static readonly factory: Record<string, ( ...args: any ) => InstanceType<any>> = {
        metric: <R = MetricRaw> (
            cls: string, a: MetricInput, b: MetricInput, opt?: MetricOptions
        ) : Metric<R> => createFromRegistry<MetricCls<R>>(
            'metric', cls, a, b, opt
        ),
        phonetic: (
            cls: string, opt?: PhoneticOptions
        ) : Phonetic => createFromRegistry<PhoneticCls>(
            'phonetic', cls, opt
        )
    };

    public static readonly filter = {
        add: Filter.add,
        remove: Filter.remove,
        pause: Filter.pause,
        resume: Filter.resume,
        list: Filter.list,
        clear: Filter.clear
    };

    public static readonly metric = {
        add: MetricRegistry.add,
        remove: MetricRegistry.remove,
        has: MetricRegistry.has,
        list: MetricRegistry.list
    };

    public static readonly phonetic = {
        add: PhoneticRegistry.add,
        remove: PhoneticRegistry.remove,
        has: PhoneticRegistry.has,
        list: PhoneticRegistry.list,
        map: {
            add: PhoneticMappingRegistry.add,
            remove: PhoneticMappingRegistry.remove,
            has: PhoneticMappingRegistry.has,
            list: PhoneticMappingRegistry.list
        }
    };

    public static readonly profiler = profiler.services;

    public static readonly clearCache = {
        normalizer: Normalizer.clear,
        metric: Metric.clear,
        phonetic: Phonetic.clear
    };

}