import { describe, it, expect } from 'vitest';
import { CmpStr } from '../src';

describe( 'CmpStr > Phonetics', () => {

    it( 'Soundex', () => {

        const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'soundex' } } );

        const res = cmp.search( 'Rubin', [ 'Rupert', 'Robert', 'Ronny', 'Robot' ] );

        expect( res ).toEqual( [ 'Rupert', 'Robert', 'Robot' ] );

    } );

    it( 'Cologne', () => {

        const cmp = CmpStr.create().setMetric( 'levenshtein' );

        const res = cmp.match( [ 'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier' ], 'Maier', 0.8, {
            processors: { phonetic: { algo: 'cologne' } }
        } );

        expect( res ).toHaveLength( 2 );

    } );

    it( 'Metaphone', () => {

        const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'metaphone' } } );

        const res = cmp.phoneticIndex(
            'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
            'in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment. His many legs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.'
        );

        expect( res ).toMatch( /^ON MRNNK EN KRKR SMS WK FRM TRBLT TRM(.+)/ );

    } );

} );