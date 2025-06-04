'use strict';

import type {
    CmpStrOptions, NormalizeFlags, DiffOptions,
    MetricInput, MetricOptions, MetricMode, MetricRaw, MetricResult
} from './utils/Types';

import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';

import { MetricRegistry, MetricCls } from './metric';
import { PhoneticRegistry, PhoneticMappingRegistry, PhoneticCls } from './phonetic';

const profiler = Profiler.getInstance();

export class CmpStr<R = MetricRaw> {

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

    public static readonly profiler = {
        report: profiler.getAll,
        clear: profiler.clear
    }

    protected readonly err = {
        metric: new Error ( `CmpStr <metric> must be set, call setMetric()` ),
        source: new Error ( `CmpStr <source> must be set, call setSource()` )
    };

    protected source?: MetricInput;
    protected normalized?: MetricInput;
    protected options: CmpStrOptions = {};
    protected metric?: MetricCls<R>;

    constructor ( source?: MetricInput, opt?: CmpStrOptions ) {

        if ( source ) this.setSource( source );
        if ( opt ) this.setOptions( opt );

    }

    protected deepMerge ( s: any, t: any ) : any {

        return (
            Object.keys( s ).forEach(
                ( k ) => t[ k ] = s[ k ] && typeof s[ k ] === 'object'
                    ? this.deepMerge( t[ k ], s[ k ] ) : s[ k ]
            ), t
        );

    }

    protected readyCheck ( source?: MetricInput, metric?: string | MetricCls<R> ) : void {

        if ( ! ( source ?? this.source ) ) throw this.err.source;

        if ( ! ( metric ?? this.metric ?? this.options.metric ) ) throw this.err.metric;

    }

    protected normalizeInput ( input: MetricInput, flags?: NormalizeFlags ) : MetricInput {

        return Normalizer.normalize( input, flags ?? this.options.normalizeFlags ?? '' );

    }

    protected filterInput ( input: MetricInput, hook: string = 'input' ) : MetricInput {

        return Array.isArray( input )
            ? input.map( s => Filter.apply( hook, s ) )
            : Filter.apply( hook, input as string );

    }

    protected prepareInput (
        input?: MetricInput, flags?: NormalizeFlags, hook: string = 'input'
    ) : MetricInput | undefined {

        return input === undefined ? undefined : this.filterInput(
            this.normalizeInput( input, flags ), hook
        );

    }

    protected resolveMetric ( metric?: string | MetricCls<R> ) : MetricCls<R> {

        if ( ! metric && ! this.metric && ! this.options.metric ) throw this.err.metric;

        if ( typeof metric === 'string' ) return MetricRegistry.get( metric ) as MetricCls<R>;

        if ( metric ) return metric;

        if ( this.metric ) return this.metric;

        return MetricRegistry.get( this.options.metric! ) as MetricCls<R>;

    }

    protected resolveOptions ( options?: CmpStrOptions ) : CmpStrOptions {

        return options ? this.deepMerge( options, { ...this.options } ) : { ...this.options };

    }

    protected resolveRaw ( raw?: boolean, options?: CmpStrOptions ) : boolean {

        return typeof raw === 'boolean' ? raw : options?.raw ?? this.options.raw ?? false;

    }

    public setSource ( input: MetricInput ) : this {

        this.source = input;
        this.normalized = this.prepareInput( input );

        return this;

    }

    public setOptions ( opt: CmpStrOptions ) : this {

        this.options = opt;

        if ( opt.metric ) this.setMetric( opt.metric );

        return this;

    }

    public mergeOptions ( opt: CmpStrOptions ) : this {

        this.setOptions( this.deepMerge( opt, this.options ) );

        return this;

    }

    public setMetric ( metric: string ) : this {

        this.metric = MetricRegistry.get( metric ) as MetricCls<R>;

        return this;

    }

}