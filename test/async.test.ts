import { describe, it, expect } from 'vitest';
import { CmpStrAsync } from '../src';

describe( 'CmpStr > Async', () => {

    it( 'Compare', async () => {

        const cmp = CmpStrAsync.create().setMetric( 'jaccard' );
        const res = await cmp.compareAsync( 'diamonds', 'Diamanten', { flags: 'i' } );

        expect( res ).within( 0.5, 0.6 );

    } );

    it( 'Batch Test', async () => {

        const cmp = CmpStrAsync.create( {
            metric: 'lcs', raw: true, opt: { removeZero: true }
        } );

        const res = await cmp.batchSortedAsync( [
            'hello', 'hola', 'hi', 'hey', 'alo', 'welcome', 'fruit'
        ], 'hallo', 'desc' );

        expect( res ).toHaveLength( 6 );

    } );

    it( 'Text Search', async () => {

        const cmp = CmpStrAsync.create();

        const res = await cmp.searchAsync( 'his', [
            'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
            'in his bed into a horrible vermin.', 'He lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections.', 'The bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment.', 'His many legs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.'
        ] );

        expect( res ).toHaveLength( 2 );

    } );

    it( 'Phonetic Index', async () => {

        const cmp = CmpStrAsync.create().setProcessors( { phonetic: { algo: 'soundex' } } );
        const res = await cmp.phoneticIndexAsync( 'Rupert' );

        expect( res ).toBe( 'R100' );

    } );

} );