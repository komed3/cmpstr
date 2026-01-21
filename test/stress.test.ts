import { describe, it, expect } from 'vitest';
import { CmpStr, CmpStrAsync } from '../src';

/**
 * Stress Test Suite for CmpStr
 * 
 * These tests evaluate CmpStr's performance and memory efficiency
 * under various load conditions and data sizes.
 */
describe( 'CmpStr > Stress Tests', () => {

    it( 'Large Batch Comparison - 1000 strings', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const largeArray = Array.from( { length: 1000 }, ( _, i ) => `string_${i}_test` );

        const startTime = performance.now();
        const res = cmp.batchTest( largeArray, 'string_500_test' );
        const endTime = performance.now();

        expect( res ).toHaveLength( 1000 );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Large Matrix Computation - 100 strings', () => {

        const cmp = CmpStr.create( { metric: 'dice' } );
        const strings = Array.from( { length: 100 }, ( _, i ) => `test_${i}` );

        const startTime = performance.now();
        const matrix = cmp.matrix( strings );
        const endTime = performance.now();

        expect( matrix ).toHaveLength( 100 );
        expect( matrix[ 0 ] ).toHaveLength( 100 );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Pairwise Comparison - 500x500', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const array1 = Array.from( { length: 500 }, ( _, i ) => `a_${i}` );
        const array2 = Array.from( { length: 500 }, ( _, i ) => `b_${i}` );

        const startTime = performance.now();
        const res = cmp.pairs( array1, array2 );
        const endTime = performance.now();

        expect( res ).toHaveLength( 500 );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Very Long Strings - 10000 characters', () => {

        const cmp = CmpStr.create( { metric: 'hamming', opt: { pad: '0' } } );
        const longString1 = 'a'.repeat( 10000 );
        const longString2 = 'a'.repeat( 9999 ) + 'b';

        const startTime = performance.now();
        const res = cmp.test( longString1, longString2 );
        const endTime = performance.now();

        expect( typeof res.match ).toBe( 'number' );
        expect( endTime - startTime ).toBeLessThan( 50 );

    } );

    it( 'Multiple Metrics Comparison', () => {

        const testString = 'performance';
        const targetString = 'performance test';
        const metrics = [ 'levenshtein', 'jaccard', 'dice', 'jaroWinkler' ];

        const results = metrics.map( metric => {
            const cmp = CmpStr.create( { metric } );
            const startTime = performance.now();
            const res = cmp.test( testString, targetString );
            const endTime = performance.now();
            return { metric, match: res.match, time: endTime - startTime };
        } );

        expect( results ).toHaveLength( 4 );
        results.forEach( r => expect( r.match ).toBeGreaterThan( 0 ) );

    } );

    it( 'Structured Data Lookup - 5000 objects', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', flags: 'i' } );
        const data = Array.from( { length: 5000 }, ( _, i ) => ( {
            id: i, name: `Product_${i}`, category: `Category_${ i % 10 }`
        } ) );

        const startTime = performance.now();
        const res = cmp.structuredLookup( 'Product_2500', data, 'name' );
        const endTime = performance.now();

        expect( res ).toHaveLength( 5000 );
        expect( endTime - startTime ).toBeLessThan( 250 );

    } );

    it( 'Search in Large Text Array', () => {

        const cmp = CmpStr.create( { metric: 'dice' } );
        const textArray = Array.from( { length: 2000 }, ( _, i ) => {
            const words = [ 'hello', 'world', 'test', 'performance', 'stress', 'memory' ];
            return words[ i % words.length ] + '_' + i;
        } );

        const startTime = performance.now();
        const res = cmp.search( 'hello', textArray );
        const endTime = performance.now();

        expect( res.length ).toBeGreaterThan( 0 );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Unicode Stress Test - Large Multilingual Strings', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const multilingualArray = [
            '你好世界',
            'مرحبا بالعالم',
            'Здравствуй мир',
            '🎉🎊🎈',
            'Καλημέρα κόσμε'
        ];

        const startTime = performance.now();
        const res = cmp.batchTest( multilingualArray, '你好世界' );
        const endTime = performance.now();

        expect( res ).toHaveLength( 5 );
        expect( endTime - startTime ).toBeLessThan( 50 );

    } );

    it( 'Closest Match with Large Dataset', () => {

        const cmp = CmpStr.create( { metric: 'jaroWinkler' } );
        const largeArray = Array.from( { length: 1000 }, ( _, i ) => `item_${i}_test` );

        const startTime = performance.now();
        const res = cmp.closest( 'item_500_test', largeArray, 5 );
        const endTime = performance.now();

        expect( res ).toHaveLength( 5 );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Zero-Result Removal on Large Dataset', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein', removeZero: true } );
        const strings = Array.from( { length: 500 }, ( _, i ) => i % 2 === 0 ? `match_${i}` : `nomatch_${i}` );

        const startTime = performance.now();
        const res = cmp.batchTest( strings, 'match_1' );
        const endTime = performance.now();

        expect( res.length ).toBeLessThan( strings.length );
        expect( res.every( ( r: any ) => r.match > 0 ) ).toBe( true );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Async Batch Processing - 500 items', async () => {

        const cmp = CmpStrAsync.create( { metric: 'dice' } );
        const items = Array.from( { length: 500 }, ( _, i ) => `async_item_${i}` );

        const startTime = performance.now();
        const res = await cmp.batchTestAsync( items, 'async_item_250' );
        const endTime = performance.now();

        expect( res ).toHaveLength( 500 );
        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Mixed Operations Performance', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const strings = Array.from( { length: 200 }, ( _, i ) => `str_${i}` );

        const startTime = performance.now();

        // Mix different operations
        for ( let i = 0; i < 10; i++ ) {
            cmp.batchTest( strings.slice( 0, 50 ), 'str_25' );
            cmp.closest( 'str_100', strings, 3 );
            cmp.match( strings.slice( 0, 30 ), 'str_15', 0.5 );
        }

        const endTime = performance.now();

        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

    it( 'Memory Efficiency - Many Small Comparisons', () => {

        const cmp = CmpStr.create( { metric: 'hamming', opt: { pad: '0' } } );

        const startTime = performance.now();
        let totalMatch = 0;

        for ( let i = 0; i < 10000; i++ ) {
            const res = cmp.test( `str${i}`, `str${ i + 1 }` );
            totalMatch += res.match;
        }

        const endTime = performance.now();

        expect( totalMatch ).toBeGreaterThan( 0 );
        expect( endTime - startTime ).toBeLessThan( 250 );

    } );

    it( 'Clone and Reuse Performance', () => {

        const original = CmpStr.create( { metric: 'levenshtein', flags: 'i' } );
        const strings = Array.from( { length: 100 }, ( _, i ) => `clone_${i}` );

        const startTime = performance.now();

        for ( let i = 0; i < 50; i++ ) {
            const cloned = original.clone();
            cloned.batchTest( strings, 'clone_50' );
        }

        const endTime = performance.now();

        expect( endTime - startTime ).toBeLessThan( 100 );

    } );

} );
