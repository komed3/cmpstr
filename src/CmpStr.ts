'use strict';

import type {
    CmpStrOptions, CmpStrParams, CmpStrResult, NormalizeFlags, DiffOptions,
    MetricInput, MetricMode, MetricRaw, MetricResult, MetricResultSingle
} from './utils/Types';

import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';
import { DiffChecker } from './utils/DiffChecker';

import { Metric, MetricCls, MetricRegistry as metric } from './metric';
import { Phonetic, PhoneticCls, PhoneticRegistry as phonetic, PhoneticMappingRegistry } from './phonetic';

const registry = { metric, phonetic };

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
        add: metric.add,
        remove: metric.remove,
        has: metric.has,
        list: metric.list
    };

    public static readonly phonetic = {
        add: phonetic.add,
        remove: phonetic.remove,
        has: phonetic.has,
        list: phonetic.list,
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

    protected options: CmpStrOptions = {};
    protected source?: MetricInput;
    protected normalized?: MetricInput;

    protected metric?: MetricCls<R>;
    protected phonetic?: PhoneticCls;

    constructor ( source?: MetricInput, metric?: string, opt?: CmpStrOptions, phonetic?: string ) {

        if ( source ) this.set( 'source', source );
        if ( opt ) this.set( 'options', opt );

        if ( metric ) this.set( 'metric', metric );
        if ( phonetic ) this.set( 'phonetic', phonetic );

    }

    protected asArr ( input: any | any[] ) : any[] {

        return Array.isArray( input ) ? input : [ input ];

    }

    protected asStr ( input: any | any[] ) : string {

        return String ( Array.isArray( input ) ? input.join( ' ' ) : input );

    }

    protected deepMerge<T extends Record<string, any>> ( s: T | undefined, t: T | undefined ) : T {

        ( s as any ) ||= {}, ( t as any ) ||= {};

        return Object.keys( s! ).forEach(
            ( k ) => ( t as any )[ k ] = s![ k ] && typeof s![ k ] === 'object'
                ? this.deepMerge( ( t as any )[ k ], s![ k ] ) : s![ k ]
        ), t ?? {} as T;

    }

    protected normalize ( input: MetricInput, flags?: NormalizeFlags ) : MetricInput {

        const { normalizeFlags } = this.options;

        return Normalizer.normalize( input, flags ?? normalizeFlags ?? '' );

    }

    protected filter ( input: MetricInput, hook: string = 'input' ) : MetricInput {

        return Array.isArray( input )
            ? input.map( s => Filter.apply( hook, s ) )
            : Filter.apply( hook, input as string );

    }

    protected prepare (
        input?: MetricInput, flags?: NormalizeFlags,
        hook: string = 'input'
    ) : MetricInput | undefined {

        return input === undefined ? undefined : (
            this.filter( this.normalize( input, flags ), hook )
        );

    }

    protected set ( key: string, val: any ) : this {

        switch ( key ) {

            case 'options': case 'opt': this.options = val instanceof Object ? val : {}; break;

            case 'source': case 'src': this.source = val;

            case 'normalized': this.normalized = this.normalize( val ); break;

            case 'metric': case 'phonetic': this[ key ] = registry[ key ].get( val ) as any; break;

            default: throw new Error ( `CmpStr key <${key}> is not supported` );

        }

        return this;

    }

    protected condition ( cond: string, test?: any ) : void {

        switch ( cond ) {

            case 'source': if ( ! ( test ?? this.source ) ) throw new Error (
                `CmpStr <source> must be set, call setSource(), ` +
                `allowed are strings or arrays of strings`
            ); break;

            case 'metric': if ( ! ( test ?? this.metric ?? this.options.metric ) ) throw new Error (
                `CmpStr <metric> must be set, call setMetric(), ` +
                `use CmpStr.metric.list() for available metrics`
            ); break;

            case 'phonetic': if ( ! ( test ?? this.phonetic ?? this.options.phonetic ) ) throw new Error (
                `CmpStr <phonetic> must be set, call setPhonetic(), ` +
                `use CmpStr.phonetic.list() for available phonetic algorithms`
            );

            default: throw new Error ( `Cmpstr condition <${cond}> unknown` );

        }

    }

    protected check ( ...cond: [ string, any? ][] ) : void {

        for ( const [ c, t ] of cond ) this.condition( c, t );

    }

    protected resolveCls<T extends MetricCls<R> | PhoneticCls> (
        key: 'metric' | 'phonetic', cls?: string | T
    ) : T {

        return ( typeof cls === 'string' ? registry[ key ].get( cls )
            : cls ?? this[ key ] ?? registry[ key ].get( this.options[ key ]! )
        ) as T;

    }

    protected resolveResult<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        result: MetricResult<R>, raw?: boolean
    ) : T {

        return ( raw ?? this.options.raw ? result : Array.isArray( result )
            ? result.map( r => ( { target: r.b, match: r.res } ) )
            : { target: result.b, match: result.res }
        ) as T;

    }

    protected compute<T extends MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        source?: MetricInput, mode?: MetricMode, ...args: CmpStrParams
    ) : T {

        let [ target, opt, flags, metric, raw ] = args;

        const src: MetricInput | undefined = this.prepare( source ?? this.source, flags );
        const tgt: MetricInput = this.prepare( target ?? '' )!;
        const cls: MetricCls<R> = this.resolveCls<MetricCls<R>>( 'metric', metric );

        this.check( [ 'source', src ], [ 'metric', cls ] );

        const cmp = new cls! ( src, tgt, this.deepMerge( this.options.metricOptions, opt ) );

        cmp.run( mode );

        return this.resolveResult<T>( cmp.getResults(), raw ) as T;

    }

    public setSource ( source: MetricInput ) : this { return this.set( 'source', source ) }

    public setOptions ( opt: CmpStrOptions ) : this { return this.set( 'options', opt ) }

    public mergeOptions ( opt: CmpStrOptions ) : this {

        return this.set( 'options', this.deepMerge<CmpStrOptions>( this.options, opt ) );

    }

    public setMetric ( name: string ) : this { return this.set( 'metric', name ) }

    public setPhonetic ( name: string ) : this { return this.set( 'phonetic', name ) }

    public clone () : CmpStr<R> {

        return Object.assign( Object.create( Object.getPrototypeOf( this ) ), this );

    }

    public reset () : this {

        this.source = undefined;
        this.normalized = undefined;
        this.options = {};

        this.metric = undefined;
        this.phonetic = undefined;

        return this;

    }

    public isReady () : boolean {

        try { this.check( [ 'source' ], [ 'metric' ] ); return true }
        catch { return false }

    }

    public getSource () : MetricInput | undefined { return this.source }

    public getNormalizedSource () : MetricInput | undefined { return this.normalized }

    public getSourceAsString () : string { return this.asStr( this.source ) }

    public getSourceAsArray () : string[] { return this.asArr( this.source ) }

    public getOptions () : CmpStrOptions { return this.options }

    public getOption ( key: keyof CmpStrOptions ) : any { return this.options[ key ] }

    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    public test<T extends CmpStrResult | MetricResultSingle<R>> ( ...args: CmpStrParams ) : T {

        return this.compute<T>( undefined, 'single', ...args ) as T;

    }

    public analyze ( input?: string ) : TextAnalyzer {

        this.check( [ 'source', input ] );

        return new TextAnalyzer ( this.asStr( input ?? this.source ) );

    }

    public diff ( target: string, opt?: DiffOptions, source?: string ) : DiffChecker {

        this.check( [ 'source', source ] );

        return new DiffChecker (
            this.asStr( source ?? this.source ), target,
            this.deepMerge<DiffOptions>( this.options.diffOptions, opt )
        );

    }

}