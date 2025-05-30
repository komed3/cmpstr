'use strict';

import type { MetricInput, MetricOptions, MetricCompute, PhoneticMapping, PhoneticMap } from '../utils/Types';
import { Metric } from './Metric';

export interface PhoneticRaw {
    indexA: string[];
    indexB: string[];
    lang?: string;
};

export abstract class Phonetic extends Metric<PhoneticRaw> {

    protected static mapping: PhoneticMapping;

    public static supportedMappings () : string[] {

        return Object.keys( this.mapping );

    }

    public static hasMapping ( id: string ) : boolean {

        return id in this.mapping;

    }

    public static addMapping ( id: string, mapping: PhoneticMap ) : boolean {

        if ( this.hasMapping( id ) ) return false;

        this.mapping[ id ] = mapping;

        return true;

    }

    public static deleteMapping ( id: string ) : boolean {

        if ( ! this.hasMapping( id ) ) return false;

        delete this.mapping[ id ];

        return true;

    }

    constructor (
        metric: string,
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        super ( metric, a, b, options, true );

    }

    protected phoneticIndex ( input: string ) : string[] {

        throw new Error ( `method index() must be overridden in a subclass` );

    }

    protected override compute (
        a: string, b: string, m: number, n: number,
        maxLen: number
    ) : MetricCompute<PhoneticRaw> {

        return { res: 0 };

    }

}