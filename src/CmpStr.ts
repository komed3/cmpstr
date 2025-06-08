/**
 * CmpStr Main API
 * src/CmpStr.ts
 * 
 * The CmpStr class provides a comprehensive, highly abstracted, and type-safe interface
 * for string comparison, similarity measurement, phonetic indexing, filtering, normalization,
 * and text analysis. It unifies all core features of the CmpStr package and exposes a
 * consistent, user-friendly API for both single and batch operations.
 * 
 * Features:
 *   - Centralized management of metrics, phonetic algorithms, and filters
 *   - Flexible normalization and filtering pipeline for all inputs
 *   - Batch, pairwise, and single string comparison with detailed results
 *   - Phonetic indexing and phonetic-aware search and comparison
 *   - Readability and text analysis utilities
 *   - Unified diff and difference reporting
 *   - Full TypeScript type safety and extensibility
 * 
 * @module CmpStr
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { CmpStrOptions, MetricInput, MetricRaw } from './utils/Types';

import { set, get, merge } from './utils/DeepMerge';
import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';
import { Profiler } from './utils/Profiler';

import { Metric, MetricRegistry as metric } from './metric';
import { Phonetic, PhoneticRegistry as phonetic, PhoneticMappingRegistry } from './phonetic';

// Import the Metric and Phonetic classes and their registries
const registry = { metric, phonetic };

// Import the Profiler instance for global profiling
const profiler = Profiler.getInstance();

/**
 * The main CmpStr class that provides a unified interface for string comparison,
 * phonetic indexing, filtering, and text analysis.
 * 
 * @template R - The type of the metric result, defaults to MetricRaw
 */
export class CmpStr<R = MetricRaw> {

    /**
     * --------------------------------------------------------------------------------
     * Static methods and properties for global access to CmpStr features
     * --------------------------------------------------------------------------------
     * 
     * These static methods provide a convenient way to access the core features of
     * the CmpStr package without needing to instantiate a CmpStr object.
     */

    /**
     * Adds, removes, pauses, resumes, lists, or clears global filters.
     * 
     * @see Filter
     */
    public static readonly filter = {
        add: Filter.add,
        remove: Filter.remove,
        pause: Filter.pause,
        resume: Filter.resume,
        list: Filter.list,
        clear: Filter.clear
    };

    /**
     * Adds, removes, checks, or lists available metrics.
     * 
     * @see Metric
     */
    public static readonly metric = {
        add: metric.add,
        remove: metric.remove,
        has: metric.has,
        list: metric.list
    };

    /**
     * Adds, removes, checks, or lists available phonetic algorithms and mappings.
     * 
     * @see Phonetic
     */
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

    /**
     * Provides access to the global profiler services.
     * 
     * @see Profiler
     */
    public static readonly profiler = profiler.services;

    /**
     * Clears the caches for normalizer, metric, and phonetic modules.
     */
    public static readonly clearCache = {
        normalizer: Normalizer.clear,
        metric: Metric.clear,
        phonetic: Phonetic.clear
    };

    protected source?: MetricInput;
    protected options: CmpStrOptions = Object.create( null );

    constructor ( source?: MetricInput, metric?: string, opt?: string | CmpStrOptions ) {

        if ( source ) this.setSource( source );

        if ( opt ) typeof opt === 'string'
            ? this.setSerializedOptions( opt )
            : this.setOptions( opt );

    }

    protected asArr ( input: any | any[] ) : any[] {

        return Array.isArray( input ) ? input : [ input ];

    }

    protected asStr ( input: any | any[], delimiter: string = ' ' ) : string {

        return String ( Array.isArray( input ) ? input.join( delimiter ) : input );

    }

    public setSource ( source: MetricInput ) : this { this.source = source; return this }

    public setOptions ( opt: CmpStrOptions ) : this { this.options = opt; return this }

    public setSerializedOptions ( opt: string ) : this {

        this.options = JSON.parse( opt );
        return this;

    }

    public setOption ( path: string, value: any ) : this {

        set<CmpStrOptions>( this.options, path, value );
        return this;

    }

    public mergeOptions ( opt: CmpStrOptions ) : this {

        merge<CmpStrOptions>( this.options, opt );
        return this;

    }

    public getSource () : MetricInput | undefined { return this.source; }

    public getSourceAsString () : string { return this.asStr( this.source ) }

    public getSourceAsArray () : string[] { return this.asArr( this.source ) }

    public getOptions () : CmpStrOptions { return this.options }

    public getSerializedOptions () : string { return JSON.stringify( this.options ) }

    public getOption ( path: string, def?: any ) : any {

        return get<CmpStrOptions, any>( this.options, path, def );

    }

}