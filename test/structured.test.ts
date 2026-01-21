import { describe, it, expect } from 'vitest';
import { CmpStr, CmpStrAsync, type MetricRaw } from '../src';

/**
 * Structured Data Test Suite for CmpStr
 * 
 * These tests validate the structured data handling capabilities of the
 * CmpStr library, ensuring accurate lookups, matches, and closest/furthest
 * computations within structured datasets.
 */
describe( 'CmpStr > Structured Data', () => {

    it( 'Basic Lookup', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredLookup( 'Mayer', [
            { id: '1', name: 'Meyer' }, { id: '2', name: 'Miller' },
            { id: '3', name: 'Müller' }, { id: '4', name: 'Meier' }
        ], 'name' );

        expect( res ).toEqual( [
            { obj: { id: '1', name: 'Meyer' }, key: 'name', result: { source: 'Mayer', target: 'Meyer', match: 0.8 } },
            { obj: { id: '2', name: 'Miller' }, key: 'name', result: { source: 'Mayer', target: 'Miller', match: 0.5 } },
            { obj: { id: '3', name: 'Müller' }, key: 'name', result: { source: 'Mayer', target: 'Müller', match: 0.5 } },
            { obj: { id: '4', name: 'Meier' }, key: 'name', result: { source: 'Mayer', target: 'Meier', match: 0.6 } }
        ] );

    } );

    it( 'Pairwise Lookup', () => {

        const cmp = CmpStr.create( { metric: 'dice' } );
        const res = cmp.structuredPairs< MetricRaw >( [
            { artistId: 'a1', artistName: 'Wolfgang Amadeus Mozart' },
            { artistId: 'a2', artistName: 'Ludwig van Beethoven' },
            { artistId: 'a3', artistName: 'Johann Sebastian Bach' }
        ], 'artistName', [
            { id: 'c1', surname: 'Mozart' },
            { id: 'c2', surname: 'Beethoven' },
            { id: 'c3', surname: 'Bach' }
        ], 'surname', { sort: 'desc' } );

        expect( res[ 0 ].result.source ).toBe( 'Ludwig van Beethoven' );

    } );

    it( 'Sorting Results', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', flags: 'i' } );
        const res = cmp.structuredLookup( 'ACME Corp', [
            { companyId: 'acme', companyName: 'ACME Corporation' },
            { companyId: 'acme_eu', companyName: 'ACME Europe GmbH' },
            { companyId: 'other', companyName: 'Other Industries Ltd' },
            { companyId: 'acme_test', companyName: 'ACME Test Inc' }
        ], 'companyName', {
            removeZero: true,
            sort: 'desc'
        } );

        expect( res[ 0 ] ).toEqual( {
            obj: { companyId: 'acme', companyName: 'ACME Corporation' }, key: 'companyName',
            result: { source: 'ACME Corp', target: 'ACME Corporation', match: 0.5625 }
        } );

    } );

    it( 'Symbol-based Keys', () => {

        const textKey = Symbol( 'text' );
        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredLookup( 'ACME Corp', [
            { [ textKey ]: 'The quick brown fox' },
            { [ textKey ]: 'A fast brown fox' },
            { [ textKey ]: 'The slow turtle' }
        ], textKey );

        expect( res ).toHaveLength( 3 );

    } );

    it( 'Threshold', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredClosest( 'Apple', [
            { id: 1, name: 'Apple iPhone' },
            { id: 2, name: 'Apple iPad' },
            { id: 3, name: 'Samsung Galaxy' },
            { id: 4, name: 'Google Pixel' }
        ], 'name', 1, { objectsOnly: true } );

        expect( res ).toEqual( [ { id: 2, name: 'Apple iPad' } ] );

    } );

    it( 'Async Lookup', async () => {

        const cmp = CmpStrAsync.create( { metric: 'dice', flags: 'i' } );
        const res = await cmp.structuredMatchAsync( 'open ai', [
            { id: '1', title: 'OpenAI GPT-3' },
            { id: '2', title: 'Artificial Intelligence' },
            { id: '3', title: 'Open Source Software' }
        ], 'title', 0.45, { objectsOnly: true } );

        expect( res ).toEqual( [ { id: '1', title: 'OpenAI GPT-3' } ] );

    } );

    it( 'Duplicate Values', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredLookup< any >( 'Hans', [
            { id: 1476, name: 'Hans' },
            { id: 2257, name: 'Franz' },
            { id: 9842, name: 'Hans' }
        ], 'name' );

        expect( res ).toHaveLength( 3 );
        expect( res[ 0 ].obj.id ).toBe( 1476 );
        expect( res[ 0 ].result.match ).toBe( 1 );
        expect( res[ 2 ].obj.id ).toBe( 9842 );
        expect( res[ 2 ].result.match ).toBe( 1 );

    } );

    it( 'Multiple Duplicate Values', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const data = [
            { category: 'Books', value: 'Python' },
            { category: 'Programming', value: 'JavaScript' },
            { category: 'Books', value: 'Python' },
            { category: 'Learning', value: 'TypeScript' },
            { category: 'Programming', value: 'Python' }
        ];

        const res = cmp.structuredLookup< any >( 'Python', data, 'value' );

        const pythonResults = res.filter( r => r.result.match === 1 );
        expect( pythonResults ).toHaveLength( 3 );
        expect( pythonResults[ 0 ].obj.category ).toBe( 'Books' );
        expect( pythonResults[ 1 ].obj.category ).toBe( 'Books' );
        expect( pythonResults[ 2 ].obj.category ).toBe( 'Programming' );

    } );

    it( 'Empty Data Array with Safe Mode', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', safeEmpty: true } );
        const res = cmp.structuredLookup( 'test', [], 'name' );

        expect( res ).toEqual( [] );

    } );

    it( 'Safe Empty Mode', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', safeEmpty: true } );
        const res = cmp.structuredLookup< any >( '', [
            { id: 1, name: 'Test' }
        ], 'name' );

        expect( res ).toEqual( [] );

    } );

    it( 'Zero Removal in Structured Lookup', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', removeZero: true } );
        const res = cmp.structuredLookup< any >( 'zzz', [
            { id: 1, name: 'apple' },
            { id: 2, name: 'banana' },
            { id: 3, name: 'zzz' }
        ], 'name' );

        expect( res ).toHaveLength( 1 );
        expect( res[ 0 ].result.match ).toBe( 1 );

    } );

    it( 'ObjectsOnly Mode', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredLookup( 'test', [
            { id: 1, name: 'Test' },
            { id: 2, name: 'Testing' }
        ], 'name', { objectsOnly: true } );

        expect( res ).toEqual( [
            { id: 1, name: 'Test' },
            { id: 2, name: 'Testing' }
        ] );

    } );

    it( 'Special Characters in Data', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredLookup< any >( '@#$%', [
            { id: 1, text: '@#$%' },
            { id: 2, text: '@#$&' },
            { id: 3, text: '****' }
        ], 'text' );

        expect( res[ 0 ].result.match ).toBe( 1 );

    } );

    it( 'Very Long Strings', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const longString = 'a'.repeat( 1000 );
        const res = cmp.structuredLookup< any >( longString, [
            { id: 1, text: longString },
            { id: 2, text: 'short' }
        ], 'text' );

        expect( res[ 0 ].result.match ).toBe( 1 );
        expect( res[ 1 ].result.match ).toBeLessThan( 0.01 );

    } );

    it( 'Numeric and Symbol Keys', () => {

        const numKey = 42;
        const symKey = Symbol( 'custom' );

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const dataNum = [ { [ numKey ]: 'value1' }, { [ numKey ]: 'value2' } ];
        const dataSym = [ { [ symKey ]: 'value1' }, { [ symKey ]: 'value2' } ];

        expect( cmp.structuredLookup( 'value', dataNum, numKey ) ).toHaveLength( 2 );
        expect( cmp.structuredLookup( 'value', dataSym, symKey ) ).toHaveLength( 2 );

    } );

    it( 'Structured Closest with Limit', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredClosest< any >( 'test', [
            { id: 1, name: 'Test' },
            { id: 2, name: 'Testing' },
            { id: 3, name: 'Tested' },
            { id: 4, name: 'Testimony' },
            { id: 5, name: 'Tester' }
        ], 'name', 2 );

        expect( res ).toHaveLength( 2 );
        expect( res[ 0 ].result.match ).toBeGreaterThanOrEqual( res[ 1 ].result.match );

    } );

    it( 'Structured Furthest', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.structuredFurthest< any >( 'abc', [
            { id: 1, name: 'abc' },
            { id: 2, name: 'xyz' },
            { id: 3, name: 'abcd' }
        ], 'name', 1 );

        expect( res ).toHaveLength( 1 );
        expect( res[ 0 ].result.match ).toBeLessThan( 0.5 );

    } );

} );
