'use strict';

import type {
    CmpStrOptions, CmpStrProcessors, NormalizeFlags, MetricRaw,
} from './utils/Types';

import * as DeepMerge from './utils/DeepMerge';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';

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

}