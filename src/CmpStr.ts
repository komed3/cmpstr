'use strict';

import type {
    CmpStrOptions, CmpStrProcessors, CmpStrResult, NormalizeFlags, DiffOptions, PhoneticOptions,
    MetricRaw, MetricInput, MetricMode, MetricResult, MetricResultSingle, MetricResultBatch
} from './utils/Types';

import * as DeepMerge from './utils/DeepMerge';
import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { factory } from './utils/Registry';
import { TextAnalyzer } from './utils/TextAnalyzer';

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

    public static analyze ( input: string ) : TextAnalyzer { return new TextAnalyzer ( input ) }

    public static diff ( a: string, b: string, opt?: DiffOptions ) : DiffChecker { return new DiffChecker ( a, b, opt ) }

    public static create<R = MetricRaw> ( opt?: string | CmpStrOptions ) : CmpStr<R> { return new CmpStr ( opt ) }

    protected options: CmpStrOptions = Object.create( null );

    protected constructor ( opt?: string | CmpStrOptions ) {

        if ( opt ) typeof opt === 'string'
            ? this.setSerializedOptions( opt )
            : this.setOptions( opt );

    }

    protected assert ( cond: string, test?: any ) : void {

        switch ( cond ) {

            case 'metric': if ( ! CmpStr.metric.has( test ) ) throw new Error (
                `CmpStr <metric> must be set, call setMetric(), ` +
                `use CmpStr.metric.list() for available metrics`
            ); break;

            case 'phonetic': if ( ! CmpStr.phonetic.has( test ) ) throw new Error (
                `CmpStr <phonetic> must be set, call setPhonetic(), ` +
                `use CmpStr.phonetic.list() for available phonetic algorithms`
            ); break;

            default: throw new Error ( `Cmpstr condition <${cond}> unknown` );

        }

    }

    protected assertMany ( ...cond: [ string, any? ][] ) : void {

        for ( const [ c, test ] of cond ) this.assert( c, test );

    }

    protected normalize ( input: MetricInput, flags?: NormalizeFlags ) : MetricInput {

        return Normalizer.normalize( input, flags ?? this.options.flags ?? '' );

    }

    protected filter ( input: MetricInput, hook: string = 'input' ) : MetricInput {

        return Filter.apply( hook, input as string );

    }

    protected resolveOptions ( opt?: CmpStrOptions ) : CmpStrOptions {

        return DeepMerge.merge( { ...( this.options ?? Object.create( null ) ) }, opt );

    }

    protected prepare ( input: MetricInput, opt?: CmpStrOptions ) : MetricInput {

        const { flags, processors } = opt ?? this.options;

        if ( flags?.length ) input = this.normalize( input, flags );

        input = this.filter( input, 'input' );

        if ( processors?.phonetic ) input = this.index( input, processors.phonetic );

        return input;

    }

    protected index ( input: MetricInput, { algo, opt }: {
        algo: string, opt?: PhoneticOptions
    } ) : MetricInput {

        this.assert( 'phonetic', algo );

        const phonetic: Phonetic = factory.phonetic( algo, opt );
        const delimiter = opt?.delimiter ?? ' ';

        return Array.isArray( input )
            ? input.map( s => phonetic.getIndex( s ).join( delimiter ) )
            : phonetic.getIndex( input ).join( delimiter );

    }

    protected compute<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions,
        mode?: MetricMode, raw?: boolean, skip?: boolean
    ) : T {

        const resolved: CmpStrOptions = this.resolveOptions( opt );

        this.assert( 'metric', resolved.metric );

        const A: MetricInput = skip ? a : this.prepare( a, resolved );
        const B: MetricInput = skip ? b : this.prepare( b, resolved );

        const metric: Metric<R> = factory.metric( resolved.metric!, A, B, resolved.opt );

        metric.run( mode );

        return this.output( metric.getResults(), raw ?? resolved.raw );

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

    public rmvOption ( path: string ) : this { DeepMerge.rmv( this.options, path ); return this }

    public setRaw ( enable: boolean ) : this { return this.setOption( 'raw', enable ) }

    public setMetric ( name: string ) : this { return this.setOption( 'metric', name ) }

    public setFlags ( flags: NormalizeFlags ) : this { return this.setOption( 'flags', flags ) }

    public rmvFlags () : this { return this.rmvOption( 'flags' ) }

    public setProcessors ( opt: CmpStrProcessors ) : this { return this.setOption( 'processors', opt ) }

    public rmvProcessors () : this { return this.rmvOption( 'processors' ) }

    public getOptions () : CmpStrOptions { return this.options }

    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    public getOption ( path: string ) : any { return DeepMerge.get( this.options, path ) }

    public test<T extends CmpStrResult | MetricResultSingle<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : T {

        return this.compute<T>( a, b, opt, 'single' );

    }

    public compare ( a: MetricInput, b: MetricInput, opt?: CmpStrOptions ) : number {

        return this.compute<MetricResultSingle<R>>( a, b, opt, 'single', true ).res;

    }

    public batchTest<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : T {

        return this.compute<T>( a, b, opt, 'batch' );

    }

    public pairs<T extends CmpStrResult[] | MetricResultBatch<R>> (
        a: MetricInput, b: MetricInput, opt?: CmpStrOptions
    ) : T {

        return this.compute<T>( a, b, opt, 'pairwise' );

    }

    public search (
        needle: string, haystack: string[], flags?: NormalizeFlags,
        processors?: CmpStrProcessors
    ) : string[] {

        const resolved: CmpStrOptions = this.resolveOptions( { flags, processors } );

        const test: string = this.prepare( needle, resolved ) as string;
        const hstk: string[] = this.prepare( haystack, resolved ) as string[];

        return haystack.filter( ( _, i ) => hstk[ i ].includes( test ) );

    }

    public matrix ( input: string[], opt?: CmpStrOptions ) : number[][] {

        input = this.prepare( input, this.resolveOptions( opt ) ) as string[];

        return input.map( a => this.compute<MetricResultBatch<R>>(
            a, input, undefined, 'batch', true, true
        ).map( b => b.res ?? 0 ) );

    }

    public phoneticIndex ( input: string, algo?: string, opt?: PhoneticOptions ) : string {

        const { algo: a, opt: o } = this.options.processors?.phonetic ?? {};

        return this.index( input, { algo: ( algo ?? a )!, opt: opt ?? o } ) as string;

    }

}