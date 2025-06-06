import { describe, it, expect } from 'vitest';
import { CmpStr, type CmpStrResult } from '../src';

describe( 'CmpStr > Metric', () => {

    it( 'Levenshtein Distance', () => {

        const cmp = new CmpStr ( 'kitten', 'levenshtein' );
        const res = cmp.test<CmpStrResult>( 'sitting' );

        expect( res.match ).toBeGreaterThan( 0.4 );

    } );

    it( 'Dice-Sørensen Coefficient', () => {

        const cmp = new CmpStr ( 'hello', 'dice', { normalizeFlags: 'i' } );
        const res = cmp.closest( [ 'Hallo', 'hola', 'hey' ], 1 );

        expect( res ).toEqual( [ { target: 'hallo', match: 0.5 } ] );

    } );

    it( 'Hamming Distance', () => {

        const cmp = new CmpStr ( 'kitten', 'hamming' );
        const res = cmp.compare( 'sittings', { opt: { pad: '0' } } );

        expect( res ).toBeCloseTo( 0.5 );

    } );

} );