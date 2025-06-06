import { describe, it, expect } from 'vitest';
import { CmpStr } from '../src';

describe( 'CmpStr > Phonetics', () => {

    it( 'Soundex', () => {

        const cmp = new CmpStr ( [ 'Rupert', 'Robert', 'Ronny', 'Robot' ] ).setPhonetic( 'soundex' );

        const res = cmp.phoneticSearch( 'Rubin' );

        expect( res ).toEqual( [ 'Rupert', 'Robert', 'Robot' ] );

    } );

    it( 'Cologne', () => {

        const cmp = new CmpStr ( [ 'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier' ] ).setPhonetic( 'cologne' );

        const res = cmp.phoneticSearch( 'Maier' );

        expect( res ).toEqual( [ 'Meyer', 'Meyers', 'Meier' ] );

    } );

    it( 'Metaphone', () => {

        const cmp = new CmpStr ();

        const res = cmp.phoneticIndex(
            'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
            'in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment. His many legs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.', { algo: 'metaphone' }
        );

        expect( res ).toMatch( /^ON MRNNK EN KRKR SMS WK FRM TRBLT TRM(.+)/ );

    } );

} );