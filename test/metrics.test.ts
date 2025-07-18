import { describe, it, expect } from 'vitest';
import { CmpStr, type CmpStrResult } from '../src';

describe( 'CmpStr > Metric', () => {

    it( 'Levenshtein Distance', () => {

        const cmp = CmpStr.create().setMetric( 'levenshtein' );
        const res = cmp.test<CmpStrResult>( 'kitten', 'sitting' );

        expect( res.match ).toBeGreaterThan( 0.4 );

    } );

    it( 'Dice-Sørensen Coefficient', () => {

        const cmp = CmpStr.create();
        const res = cmp.closest( 'hello', [ 'Hallo', 'hola', 'hey' ], 1, { flags: 'i', metric: 'dice' } );

        expect( res ).toEqual( [ {
            source: 'hello', target: 'Hallo',
            match: 0.5
        } ] );

    } );

    it( 'Hamming Distance', () => {

        const cmp = CmpStr.create( '{ "metric": "hamming", "opt": { "pad": "0" } }' );
        const res = cmp.compare( 'kitten', 'sittings' );

        expect( res ).toBeCloseTo( 0.5 );

    } );

    it( 'Needleman-Wunsch Distance', () => {

        const cmp = CmpStr.create().setMetric( 'needlemanWunsch' );
        const res = cmp.match( [ 'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier' ], 'Maier', 0.6 );

        expect( res ).toHaveLength( 4 );

    } );

    it( 'Jaro-Winkler Distance', () => {

        const cmp = CmpStr.create().setMetric( 'jaroWinkler' ).setFlags( 'i' );
        const res = cmp.pairs( [ 'heLLo', 'hi', 'Hola' ], [ 'hallo', 'Allo', 'hey' ] );

        expect( res ).toEqual( [
            { source: 'heLLo', target: 'hallo', match: 0.88 },
            { source: 'hi', target: 'Allo', match: 0 },
            { source: 'Hola', target: 'hey', match: 0.575 }
        ] );

        expect( () => { cmp.pairs( [ 'heLLo', 'hi', 'Hola' ], [ 'hallo', 'allo' ] ) } ).toThrowError(
            `Mode <pairwise> requires arrays of equal length`
        );

    } );

} );
