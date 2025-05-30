'use strict';

import { MetricInput, MetricOptions, PhoneticMapping } from '../utils/Types';
import { Phonetic } from './Phonetic';

export default class Soundex extends Phonetic {

    protected static override mapping: PhoneticMapping = {
        en: {
            map: {
                a: '0', e: '0', h: '0', i: '0', o: '0', u: '0', w: '0', y: '0',
                b: '1', f: '1', p: '1', v: '1',
                c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
                d: '3', t: '3', l: '4', m: '5', n: '5', r: '6',
            }
        },
        de: {
            map: {
                a: '0', ä: '0', e: '0', h: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', f: '1', p: '1', v: '1', w: '1',
                c: '2', g: '2', k: '2', q: '2', s: '2', ß: '2', x: '2', z: '2',
                d: '3', t: '3', l: '4', m: '5', n: '5', r: '6',
            }
        },
        cologne: {
            map: {
                a: '0', ä: '0', e: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', p: '1', d: '2', t: '2', f: '3', v: '3', w: '3',
                g: '4', k: '4', q: '4', l: '5', m: '6', n: '6', r: '7',
                c: '8', s: '8', ß: '8', z: '8', x: '48'
            },
            ignore: [ 'h' ],
            rules: [
                { char: 'p', next: [ 'h' ], code: '3' },
                { char: 'd', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 't', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 'x', prev: [ 'c', 'k', 'q' ], code: '8' },
                { char: 'c', prev: [ 's', 'z' ], code: '8' },
                { char: 'c', position: 'start', next: [ 'a', 'h', 'k', 'l', 'o', 'q', 'r', 'u', 'x' ], code: '4' },
                { char: 'c', next: [ 'a', 'h', 'k', 'o', 'q', 'u', 'x' ], prevNot: [ 's', 'z' ], code: '4' }
            ]
        }
    };

    constructor (
        a: MetricInput, b: MetricInput,
        options: MetricOptions = {}
    ) {

        super ( 'soundex', a, b, options );

    }

    protected override phoneticIndex ( input: string ) : string[] {

        const { delimiter = ' ', phonetic: { mapping = 'en', length = 4 } = {} } = this.options;

        //

        return [];

    }

}