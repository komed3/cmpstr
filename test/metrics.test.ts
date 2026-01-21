import { describe, it, expect } from 'vitest';
import { CmpStr, type CmpStrResult } from '../src';

/**
 * Metric Test Suite for CmpStr
 * 
 * These tests validate the various string similarity and distance
 * metrics implemented in the CmpStr library.
 */
describe( 'CmpStr > Metric', () => {

    it( 'Levenshtein Distance', () => {

        const cmp = CmpStr.create().setMetric( 'levenshtein' );
        const res = cmp.test<CmpStrResult>( 'kitten', 'sitting' );

        expect( res.match ).toBeGreaterThan( 0.4 );

    } );

    it( 'Dice-Sørensen Coefficient', () => {

        const cmp = CmpStr.create();
        const res = cmp.closest( 'hello', [ 'Hallo', 'hola', 'hey' ], 1, { flags: 'i', metric: 'dice' } );

        expect( res ).toEqual( [ { source: 'hello', target: 'Hallo', match: 0.5 } ] );

    } );

    it( 'Hamming Distance', () => {

        const cmp = CmpStr.create( '{ "metric": "hamming", "opt": { "pad": "0" } }' );
        const res = cmp.compare( 'kitten', 'sittings' );

        expect( res ).toBeCloseTo( 0.5 );

    } );

    it( 'Needleman-Wunsch Distance', () => {

        const cmp = CmpStr.create().setMetric( 'needlemanWunsch' );
        const res = cmp.test( 'GATTACA', 'GTCGACGCA', { raw: true, opt: { gap: -2 } } );

        expect( res ).toEqual( {
            metric: 'needlemanWunsch', a: 'GATTACA', b: 'GTCGACGCA',
            res: 0, raw: { score: -3, denum: 9 }
        } );

    } );

    it( 'Jaccard Index', () => {

        const cmp = CmpStr.create().setMetric( 'jaccard' );
        const res = cmp.match( [ 'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier' ], 'Maier', 0.6 );

        expect( res ).toHaveLength( 2 );

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

    it( 'Safe-Mode: Return [] for empty input(s)', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', safeEmpty: true } );

        expect( cmp.test( '', '' ) ).toEqual( [] );
        expect( cmp.test( 'test', '' ) ).toEqual( [] );
        expect( cmp.test( '', 'test' ) ).toEqual( [] );

        expect( cmp.batchTest( [], [] ) ).toEqual( [] );
        expect( cmp.batchTest( [], 'test' ) ).toEqual( [] );

        expect( cmp.match( 'test', [], 0.5 ) ).toEqual( [] );

    } );

    it( 'Unicode and Special Characters', () => {

        const cmp = CmpStr.create().setMetric( 'levenshtein' );
        const res = cmp.test( '🎉🎊', '🎉🎊' );

        expect( res.match ).toBe( 1 );

    } );

    it( 'Case-Insensitive Matching', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', flags: 'i' } );
        const res = cmp.test( 'Hello', 'HELLO' );

        expect( res.match ).toBe( 1 );

    } );

    it( 'Matrix Computation', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const matrix = cmp.matrix( [ 'cat', 'bat', 'cat' ] );

        expect( matrix ).toHaveLength( 3 );
        expect( matrix[ 0 ] ).toHaveLength( 3 );
        expect( matrix[ 0 ][ 0 ] ).toBe( 1 );
        expect( matrix[ 0 ][ 2 ] ).toBe( 1 );

    } );

    it( 'Furthest Match', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.furthest( 'apple', [ 'apple', 'apricot', 'orange', 'grape' ], 1 );

        expect( res ).toHaveLength( 1 );
        expect( res[ 0 ].target ).toBe( 'orange' );

    } );

    it( 'Batch Sorted with Ascending', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.batchSorted( [ 'test', 'testing', 'best', 'fest' ], 'Test', 'asc' );

        expect( res[ 0 ].match ).toBeLessThanOrEqual( res[ res.length - 1 ].match );

    } );

    it( 'Phonetic Search Integration', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.phoneticIndex( 'Schmidt', 'soundex' );

        expect( res ).toBeDefined();
        expect( typeof res ).toBe( 'string' );

    } );

    it( 'Options Cloning and Sharing', () => {

        const cmp1 = CmpStr.create( { metric: 'levenshtein', flags: 'i' } );
        const cmp2 = cmp1.clone();

        const opt1Before = cmp1.getOption( 'metric' );
        expect( opt1Before ).toBe( 'levenshtein' );

        cmp2.setMetric( 'dice' );
        const opt2 = cmp2.getOption( 'metric' );

        expect( opt2 ).toBe( 'dice' );

    } );

    it( 'Remove Zero Results', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', removeZero: true } );
        const res = cmp.batchTest( [ 'abc', 'xyz', 'abc' ], 'abc' );

        expect( res.some( ( r: any ) => r.match === 0 ) ).toBe( false );

    } );

} );
