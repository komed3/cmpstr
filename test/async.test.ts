import { describe, it, expect } from 'vitest';
import { CmpStrAsync } from '../src';

describe( 'CmpStr > Async', () => {

    it( 'Compare', async () => {

        const cmp = new CmpStrAsync ( 'diamonds', 'jaccard' );
        const res = await cmp.compareAsync( 'Diamanten', { flags: 'i' } );

        expect( res ).within( 0.5, 0.6 );

    } );

    it( 'Batch Test', async () => {

        const cmp = new CmpStrAsync ( [ 'hello', 'hola', 'hi', 'hey', 'alo', 'welcome', 'fruit' ], 'lcs' );
        const res = await cmp.batchSortedAsync( 'hallo', 'desc', { raw: true, opt: { removeZero: true } } );

        expect( res ).toHaveLength( 6 );

    } );

    it( 'Text Search', async () => {

        const cmp = new CmpStrAsync ( [
            'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
            'in his bed into a horrible vermin.', 'He lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections.', 'The bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment.', 'His many legs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.'
        ] );

        const res = await cmp.searchAsync( 'his' );

        expect( res ).toHaveLength( 2 );

    } );

    it( 'Phonetic Index', async () => {

        const cmp = new CmpStrAsync ( 'Rupert' ).setPhonetic( 'soundex' );
        const res = await cmp.phoneticIndexAsync();

        expect( res ).toBe( 'R100' );

    } );

} );