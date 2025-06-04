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

    protected source: MetricInput | undefined;
    protected normalized: MetricInput | undefined;
    protected options: CmpStrOptions = {};
    protected metric: MetricCls<R> | undefined;

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

    protected normalize ( input: MetricInput, flags?: NormalizeFlags ) : MetricInput {

        return Normalizer.normalize( input, flags ?? this.options.normalizeFlags ?? '' );

    }

    protected compute (
        a: MetricInput, b: MetricInput, opt: MetricOptions,
        mode?: MetricMode
    ) : MetricResult<R> {

        const cmp = new this.metric!( a, b, opt );

        cmp.run( mode );

        return cmp.getResults();

    }

    public setSource ( input: MetricInput ) : CmpStr<R> {

        this.source = input, this.normalized = this.normalize( input );

        return this;

    }

    public setOptions ( opt: CmpStrOptions ) : CmpStr<R> {

        this.options = opt;

        return this;

    };

    public mergeOptions ( opt: CmpStrOptions ) : CmpStr<R> {

        this.setOptions( this.deepMerge( this.options, opt ) );

        return this;

    }

    public setMetric ( metric: string ) : CmpStr<R> {

        this.metric = MetricRegistry.get( metric ) as MetricCls<R>;

        return this;

    }

    public getSource () : MetricInput | undefined { return this.source }

    public getNormalizedSource () : MetricInput | undefined { return this.normalized }

    public getSourceAsString () : string {

        return Array.isArray( this.source ) ? this.source.join( ' ' ) : this.source ?? '';

    }

    public getOptions () : CmpStrOptions { return this.options }

    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    public analyze () : TextAnalyzer { return new TextAnalyzer ( this.getSourceAsString() ) }

    public diff ( target: string, options?: DiffOptions ) : DiffChecker {

        return new DiffChecker (
            this.getSourceAsString(), target,
            options ?? this.options.diffOptions ?? {}
        );

    }

}