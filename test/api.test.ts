import { describe, it, expect } from 'vitest';
import { CmpStr } from '../src';

describe( 'CmpStr > API', () => {

    it( 'Filter', () => {

        expect( CmpStr.filter.add( 'test', 'test', ( s ) => s ) ).toBe( true );

        expect( CmpStr.filter.list( 'test' ) ).toEqual( [ 'test' ] );

        expect( CmpStr.filter.remove( 'test', 'test' ) ).toBe( true );

    } );

    it( 'Metric', () => {

        expect( CmpStr.metric.list() ).toHaveLength( 11 );

        expect( CmpStr.metric.has( 'dice' ) ).toBe( true );

    } );

    it( 'Phonetic', () => {

        expect( CmpStr.phonetic.list() ).toHaveLength( 3 );

        expect( CmpStr.phonetic.has( 'cologne' ) ).toBe( true );

        expect( CmpStr.phonetic.map.has( 'soundex', 'de' ) ).toBe( true );

        expect( CmpStr.phonetic.map.remove( 'soundex', 'de' ) ).toBeUndefined();

        expect( CmpStr.phonetic.map.list( 'soundex' ) ).toEqual( [ 'en' ] );

    } );

    it( 'Profiler', () => {

        expect( CmpStr.profiler.enable() ).toBeUndefined();

        expect( CmpStr.profiler.total() ).toEqual( { time: 0, mem: 0 } );

        const cmp = CmpStr.create().setMetric( 'levenshtein' );
        cmp.test( 'kitten', 'sitting' );

        const total = CmpStr.profiler.total();

        expect( total.time ).toBeGreaterThan( 0 );
        expect( total.mem ).toBeGreaterThan( 0 );

        expect( CmpStr.profiler.last() ).toBeTypeOf( 'object' );

    } );

} );
