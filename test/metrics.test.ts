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

    it( 'Needleman-Wunsch Distance', () => {

        const cmp = new CmpStr ( [ 'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier' ], 'needlemanWunsch' );
        const res = cmp.match( 'Maier', 0.6 );

        expect( res ).toHaveLength( 4 );

    } );

    it( 'Jaro-Winkler Distance', () => {

        const cmp = new CmpStr ( [ 'hello', 'hi', 'hola' ] ).setMetric( 'jaroWinkler' );
        const res = cmp.pairs( [ 'hallo', 'allo', 'hey' ] );

        expect( res ).toEqual( [
            { target: 'hallo', match: 0.88 },
            { target: 'allo', match: 0 },
            { target: 'hey', match: 0.575 }
        ] );

        expect( () => { cmp.pairs( [ 'hallo', 'allo' ] ) } ).toThrowError(
            `mode <pairwise> requires arrays of equal length`
        );

    } );

} );