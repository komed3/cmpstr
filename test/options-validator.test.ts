import { describe, expect, it, afterEach } from 'vitest';
import { CmpStr } from '../src';
import { Metric, MetricRegistry } from '../src/metric';
import { CmpStrValidationError } from '../src/utils/Errors';

/**
 * Options Validator Test Suite for CmpStr
 * 
 * These tests validate the behavior of the OptionsValidator utility in CmpStr,
 * ensuring that it correctly throws validation errors when invalid options are
 * provided, and that it accepts valid options including dynamically registered
 * metrics.
 */
describe( 'CmpStr Options Validator', () => {

    afterEach( () => { if ( MetricRegistry.has( 'dummy' ) ) MetricRegistry.remove( 'dummy' ) } );

    it( 'Throws when setting an invalid metric via setMetric', () => {
        expect( () => CmpStr.create().setMetric( 'unknown_metric' ) )
            .toThrow( CmpStrValidationError );
    } );

    it( 'Throws when calling compute with invalid metric in options', () => {
        const cmp = CmpStr.create().setMetric( 'levenshtein' );

        expect( () => cmp.compare( 'a', 'b', { metric: 'unknown_metric' } ) )
            .toThrow( CmpStrValidationError );
    } );

    it( 'Throws when setting invalid flags', () => {
        expect( () => CmpStr.create().setFlags( 'z' as any ) )
            .toThrow( CmpStrValidationError );
    } );

    it( 'Throws when setting invalid phonetic processor', () => {
        expect( () => CmpStr.create().setProcessors( { phonetic: { algo: 'unknown_algo' } } ) )
            .toThrow( CmpStrValidationError );
    } );

    it( 'Accepts dynamically registered metrics', () => {
        class DummyMetric extends Metric {
            protected compute () {
                return { res: 0 };
            }
        }

        MetricRegistry.add( 'dummy', DummyMetric );

        const cmp = CmpStr.create().setMetric( 'dummy' );
        expect( cmp.compare( 'a', 'b' ) ).toBe( 0 );
    } );

} );
