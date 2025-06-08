'use strict';

import type {
    CmpStrOptions, CmpStrProcessors, CmpStrResult, NormalizeFlags, PhoneticOptions,
    MetricRaw, MetricInput, MetricMode, MetricResult
} from './utils/Types';

import * as DeepMerge from './utils/DeepMerge';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { factory } from './utils/Registry';

import { MetricRegistry, Metric } from './metric';
import { PhoneticRegistry, PhoneticMappingRegistry, Phonetic } from './phonetic';

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

    public static readonly profiler = profiler.services;

    public static readonly clearCache = {
        normalizer: Normalizer.clear,
        metric: Metric.clear,
        phonetic: Phonetic.clear
    };

    public static create<R = MetricRaw> ( opt?: string | CmpStrOptions ) : CmpStr<R> { return new CmpStr ( opt ) }

    protected options: CmpStrOptions = Object.create( null );

    protected constructor ( opt?: string | CmpStrOptions ) {

        if ( opt ) typeof opt === 'string'
            ? this.setSerializedOptions( opt )
            : this.setOptions( opt );

    }

    protected normalize ( input: MetricInput, f?: NormalizeFlags ) : MetricInput {

        return Normalizer.normalize( input, f ?? this.options.flags ?? '' );

    }

    protected filter ( input: MetricInput, hook: string = 'input' ) : MetricInput {

        return Filter.apply( hook, input as string );

    }

    protected index ( input: MetricInput, { algo, opt }: {
        algo: string, opt?: PhoneticOptions
    } ) : MetricInput {

        const phonetic: Phonetic = factory.phonetic( algo, opt );
        const delimiter = opt?.delimiter ?? ' ';

        return Array.isArray( input )
            ? input.map( s => phonetic.getIndex( s ).join( delimiter ) )
            : phonetic.getIndex( input ).join( delimiter );

    }

    protected prepare ( input: MetricInput, opt?: CmpStrOptions ) : MetricInput {

        const { flags, processors } = opt ?? {};

        if ( flags?.length ) input = this.normalize( input, flags );

        input = this.filter( input, 'input' );

        if ( processors?.phonetic ) input = this.index( input, processors.phonetic );

        return input;

    }

    protected compute<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions,
        mode?: MetricMode, raw?: boolean
    ) : T {

        opt = DeepMerge.merge( this.options, opt ) ?? {};

        const A: MetricInput = this.prepare( a, opt );
        const B: MetricInput = this.prepare( b, opt );

        const metric: Metric<R> = factory.metric( opt.metric!, A, B, opt?.opt );

        metric.run( mode );

        return this.output( metric.getResults(), raw );

    }

    protected output<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        result: MetricResult<R>, raw?: boolean
    ) : T {

        return ( raw ?? this.options.raw ? result : Array.isArray( result )
            ? result.map( r => ( { source: r.a, target: r.b, match: r.res } ) )
            : { source: result.a, target: result.b, match: result.res }
        ) as T;

    }

    public clone () : CmpStr<R> { return Object.assign( Object.create( Object.getPrototypeOf( this ) ), this ) }

    public reset () : this { for ( const k in this.options ) delete ( this.options as any )[ k ]; return this }

    public setOptions ( opt: CmpStrOptions ) : this { this.options = opt; return this }

    public mergeOptions ( opt: CmpStrOptions ) : this { DeepMerge.merge( this.options, opt ); return this }

    public setSerializedOptions ( opt: string ) : this { this.options = JSON.parse( opt ); return this }

    public setOption ( path: string, value: any ) : this { DeepMerge.set( this.options, path, value ); return this }

    public setRaw ( enable: boolean ) : this { return this.setOption( 'raw', enable ) }

    public setMetric ( name: string ) : this { return this.setOption( 'metric', name ) }

    public setFlags ( flags: NormalizeFlags ) : this { return this.setOption( 'flags', flags ) }

    public setProcessors ( opt: CmpStrProcessors ) : this { return this.setOption( 'processors', opt ) }

    public getOptions () : CmpStrOptions { return this.options }

    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    public getOption ( path: string ) : any { return DeepMerge.get( this.options, path ) }

    public test ( a: MetricInput, b: MetricInput, opt?: CmpStrOptions ) {

        return this.compute( a, b, opt, 'single' );

    }

}