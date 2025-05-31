'use strict';

import type { PhoneticMapping, PhoneticOptions } from '../utils/Types';
import { Phonetic } from './Phonetic';

export default class Soundex extends Phonetic {

    protected static override default: PhoneticOptions = {
        map: 'en', delimiter: ' ', length: 4, pad: '0'
    };

    protected static override mapping: PhoneticMapping = {
        en: {
            map: {
                a: '0', e: '0', h: '0', i: '0', o: '0', u: '0', w: '0', y: '0',
                b: '1', f: '1', p: '1', v: '1',
                c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
                d: '3', t: '3',
                l: '4',
                m: '5', n: '5',
                r: '6'
            }
        },
        de: {
            map: {
                a: '0', ä: '0', e: '0', h: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', f: '1', p: '1', v: '1', w: '1',
                c: '2', g: '2', k: '2', q: '2', s: '2', ß: '2', x: '2', z: '2',
                d: '3', t: '3',
                l: '4',
                m: '5', n: '5',
                r: '6'
            },
            ruleset: [
                { char: 'c', next: [ 'h' ], code: '7' }
            ]
        }
    };

    protected override adjustCode( code: string, chars: string[] ) : string {

        return chars[ 0 ].toUpperCase() + code.slice( 1 ).replaceAll( '0', '' );

    }

    constructor ( options: PhoneticOptions = {} ) {

        super (
            Soundex.mapping[ options.map ?? Soundex.default.map! ],
            { ...Soundex.default, ...options }
        );

    }

}