'use strict';

import type { PhoneticOptions } from '../utils/Types';
import { Phonetic } from './Phonetic';

export default class Cologne extends Phonetic {

    protected static override default: PhoneticOptions = {
        delimiter: ' ', length: -1
    };

    constructor ( options: PhoneticOptions = {} ) {

        super ( {
            map: {
                a: '0', ä: '0', e: '0', i: '0', j: '0', o: '0', ö: '0', u: '0', ü: '0', y: '0',
                b: '1', p: '1',
                d: '2', t: '2',
                f: '3', v: '3', w: '3',
                g: '4', k: '4', q: '4',
                l: '5',
                m: '6', n: '6',
                r: '7',
                c: '8', s: '8', ß: '8', z: '8',
                x: '48'
            },
            ignore: [ 'h' ],
            ruleset: [
                { char: 'p', next: [ 'h' ], code: '3' },
                { char: 'c', position: 'start', next: [ 'a', 'h', 'k', 'l', 'o', 'q', 'r', 'u', 'x' ], code: '4' },
                { char: 'c', next: [ 'a', 'h', 'k', 'o', 'q', 'u', 'x' ], prevNot: [ 's', 'z' ], code: '4' },
                { char: 'd', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 't', next: [ 'c', 's', 'z' ], code: '8' },
                { char: 'x', prev: [ 'c', 'k', 'q' ], code: '8' }
            ]
        }, { ...Cologne.default, ...options } );

    }

    protected override adjustCode( code: string ) : string {

        return code.slice( 0, 1 ) + code.slice( 1 ).replaceAll( '0', '' );

    }

}