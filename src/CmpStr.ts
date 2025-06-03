'use strict';

import type { CmpStrOptions } from './utils/Types';

import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';

import { MetricRegistry } from './metric';
import { PhoneticRegistry, PhoneticMappingRegistry } from './phonetic';

const profiler = Profiler.getInstance();

export default class CmpStr {

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

    protected source: string | string[] = '';

    protected options: CmpStrOptions = {};

    constructor ( source?: string | string[], options?: CmpStrOptions ) {

        if ( source ) this.setSource( source );
        if ( options ) this.setOptions( options );

    }

    public setSource ( input: string | string[] ) : void { this.source = input }

    public setOptions ( options: CmpStrOptions ) : void { this.options = options };

    public mergeOptions ( options: CmpStrOptions ) : void {

        const deepMerge = ( s: any, t: any ) : any => (
            Object.keys( s ).forEach(
                ( k ) => t[ k ] = s[ k ] && typeof s[ k ] === 'object'
                    ? deepMerge( t[ k ], s[ k ] )
                    : s[ k ]
            ), t
        );

        this.setOptions( deepMerge( this.options, options ) );

    }

    public getSource () : string | string[] { return this.source }

    public getOptions () : CmpStrOptions { return this.options }

}