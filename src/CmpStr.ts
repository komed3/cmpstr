'use strict';

import type {
    CmpStrOptions, NormalizeFlags, DiffOptions, MetricInput, MetricOptions, MetricMode,
    CmpStrResult, MetricRaw, MetricResult, MetricResultSingle, MetricResultBatch
} from './utils/Types';

import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';

import { MetricRegistry, Metric, MetricCls } from './metric';
import { PhoneticRegistry, PhoneticMappingRegistry, Phonetic, PhoneticCls } from './phonetic';

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

    protected source?: MetricInput;
    protected normalized?: MetricInput;
    protected options: CmpStrOptions = {};
    protected metric?: MetricCls<R>;

    constructor ( source?: MetricInput, metric?: string, opt?: CmpStrOptions ) {

        if ( source ) this.setSource( source );
        if ( metric ) this.setMetric( metric );
        if ( opt ) this.setOptions( opt );

    }

    protected deepMerge ( s: Record<string, any>, t: Record<string, any> ) : Record<string, any> {

        return (
            Object.keys( s ?? {} ).forEach(
                ( k ) => t[ k ] = s[ k ] && typeof s[ k ] === 'object'
                    ? this.deepMerge( t[ k ], s[ k ] ) : s[ k ]
            ), t ?? {}
        );

    }

    protected asArr ( input: any | any[] ) : any[] {

        return Array.isArray( input ) ? input : [ input ];

    }

    protected searchArr ( s: MetricInput, t: MetricInput ) : { index: number, match: string }[] {

        const res: { index: number, match: string }[] = [];

        this.asArr( s ).forEach( ( s, i ) => {
            s.includes( t ) && res.push( { index: i, match: s } )
        } );

        return res;

    }

    protected sourceCheck ( source?: MetricInput ) : void {

        if ( ! ( source ?? this.source ) ) throw new Error (
            `CmpStr <source> must be set, call setSource()`
        );

    }

    protected metricCheck ( metric?: string | MetricCls<R> ) : void {

        if ( ! ( metric ?? this.metric ?? this.options.metric ) ) throw new Error (
            `CmpStr <metric> must be set, call setMetric()`
        );

    }

    protected readyCheck ( source?: MetricInput, metric?: string | MetricCls<R> ) : void {

        this.sourceCheck( source );
        this.metricCheck( metric );

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

        this.metricCheck( metric );

        return ( typeof metric === 'string'
            ? MetricRegistry.get( metric )
            : metric ?? this.metric ?? MetricRegistry.get( this.options.metric! )
        ) as MetricCls<R>;

    }

    protected resolveOptions ( options?: CmpStrOptions ) : CmpStrOptions {

        return options ? this.deepMerge( options, { ...this.options } ) : { ...this.options };

    }

    protected resolveResult ( result: MetricResult<R>, raw?: boolean ) : MetricResult<R> | CmpStrResult | CmpStrResult[] {

        return raw ? result : Array.isArray( result )
            ? result.filter( r => ! this.options.removeZero || r.res > 0 )
                    .map( r => ( { target: r.b, match: r.res } ) )
            : { target: result.b, match: result.res };

    }

    protected compute<T = MetricResult<R> | CmpStrResult | CmpStrResult[]> (
        source?: MetricInput, target?: MetricInput, options?: MetricOptions,
        mode?: MetricMode, metric?: string | MetricCls<R>, raw?: boolean
    ) : T {

        const opt: CmpStrOptions = this.resolveOptions( { metricOptions: options ?? {} } );
        const src: MetricInput | undefined = this.prepareInput( source ?? this.source, opt.normalizeFlags, 'input' );
        const tgt: MetricInput | undefined = this.prepareInput( target, opt.normalizeFlags, 'input' );
        const met: MetricCls<R> = this.resolveMetric( metric ?? opt.metric );

        this.readyCheck( src, met );

        const cmp = new met ( src!, tgt ?? '', opt.metricOptions ?? {} );

        cmp.run( mode );

        return this.resolveResult( cmp.getResults(), raw ?? this.options.raw ?? false ) as T;

    }

    public setSource ( input: MetricInput ) : this {

        this.source = input, this.normalized = this.prepareInput( input );

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

    public reset () : this {

        this.source = undefined;
        this.normalized = undefined;
        this.options = {};

        this.metric = undefined;

        return this;

    }

    public getSource () : MetricInput | undefined { return this.source }

    public getNormalizedSource () : MetricInput | undefined { return this.normalized }

    public getSourceAsString () : string {

        return Array.isArray( this.source ) ? this.source.join( ' ' ) : this.source ?? '';

    }

    public getOptions () : CmpStrOptions { return this.options }

    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    public isReady () : boolean { try { this.readyCheck(); return true; } catch { return false; } }

    public test<T = CmpStrResult | MetricResultSingle<R>> (
        target?: MetricInput, options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.compute<T>( undefined, target, options, 'single', metric, raw ) as T;

    }

    public compare ( target?: MetricInput, options?: MetricOptions, metric?: string ) : number {

        return this.test<CmpStrResult>( target, options, metric ).match;

    }

    public batchTest<T = CmpStrResult[] | MetricResultBatch<R>> (
        target?: MetricInput, options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.compute<T>( undefined, target, options, 'batch', metric, raw ) as T;

    }

    public batchSorted<T = CmpStrResult[] | MetricResultBatch<R>> (
        target?: MetricInput, dir: 'desc' | 'asc' = 'desc', options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.resolveResult(
            this.batchTest<MetricResultBatch<R>>( target, options, metric, true )
                .sort( ( a, b ) => dir === 'asc' ? a.res - b.res : b.res - a.res ),
            raw ?? this.options.raw
        ) as T;

    }

    public pairs<T = CmpStrResult[] | MetricResultBatch<R>> (
        target?: MetricInput, options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.compute<T>( undefined, target, options, 'pairwise', metric, raw ) as T;

    }

    public match<T = CmpStrResult[] | MetricResultBatch<R>> (
        target?: MetricInput, threshold: number = 0.8, options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.resolveResult(
            this.batchTest<MetricResultBatch<R>>( target, options, metric, true )
                .filter( r => r.res >= threshold )
                .sort( ( a, b ) => b.res - a.res ),
            raw ?? this.options.raw
        ) as T;

    }

    public closest<T = CmpStrResult[] | MetricResultBatch<R>> (
        target?: MetricInput, n: number = 1, options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.batchSorted( target, 'desc', options, metric, raw ).slice( 0, n ) as T;

    }

    public furthest<T = CmpStrResult[] | MetricResultBatch<R>> (
        target?: MetricInput, n: number = 1, options?: MetricOptions,
        metric?: string, raw?: boolean
    ) : T {

        return this.batchSorted( target, 'asc', options, metric, raw ).slice( 0, n ) as T;

    }

    public search ( target: string, flags?: NormalizeFlags ) : { index: number, match: string }[] {

        this.sourceCheck();

        const src: MetricInput = this.prepareInput( this.source, flags, 'input' )!;
        const tgt: MetricInput = this.prepareInput( target, flags, 'input' )!;

        return this.searchArr( src, tgt );

    }

    public matrix ( target?: MetricInput, options?: MetricOptions, metric?: string ) : number[][] {

        const src: string[] = this.asArr( this.source ?? target );
        const tgt: string[] = this.asArr( target );

        return src.map( a => this.compute<MetricResultBatch<R>>(
            a, tgt, options, 'batch', metric, true
        ).map( b => b.res ) );

    }

    public analyze ( flags?: NormalizeFlags ) : TextAnalyzer {

        this.sourceCheck();

        const src: MetricInput = this.prepareInput( this.source, flags, 'input' )!;

        return new TextAnalyzer ( Array.isArray( src ) ? src.join( ' ' ) : src );

    }

    public diff ( target: string, options?: DiffOptions ) : DiffChecker {

        this.sourceCheck();

        return new DiffChecker (
            this.getSourceAsString(), target,
            this.resolveOptions( { diffOptions: options } ).diffOptions
        );

    }

}