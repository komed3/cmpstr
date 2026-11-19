import { describe, expect, it } from 'vitest';
import { CmpStr } from '../src';

/**
 * Phonetics Test Suite for CmpStr
 * 
 * These tests validate the phonetic algorithms integrated within the
 * CmpStr library, ensuring correct phonetic indexing and matching
 * functionalities.
 */
describe( 'CmpStr > Phonetics', () => {
  it( 'Phonetic Index', () => {
    const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'soundex' } } );

    expect( cmp.phoneticIndex( 'Robert' ) ).toBe( 'R163' );
    expect( cmp.phoneticIndex( 'Rupert' ) ).toBe( 'R163' );
  } );

  it( 'Soundex', () => {
    const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'soundex', opt: { length: 2 } } } );
    const res = cmp.search( 'Rupert', [ 'Rubin', 'Robert', 'Ronny', 'Robot' ] );

    expect( res ).toEqual( [ 'Rubin', 'Robert', 'Robot' ] );
  } );

  it( 'Soundex H/W handling', () => {
    const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'soundex' } } );

    expect( cmp.phoneticIndex( 'Ashcraft' ) ).toBe( 'A261' );
    expect( cmp.phoneticIndex( 'Aswcraft' ) ).toBe( 'A261' );
    expect( cmp.phoneticIndex( 'Bwb' ) ).toBe( 'B000' );
  } );

  it( 'Soundex default options remain unchanged', () => {
    const custom = CmpStr.create().setProcessors( { phonetic: { algo: 'soundex', opt: { length: 2 } } } );
    expect( custom.phoneticIndex( 'Robert' ) ).toBe( 'R1' );

    const defaults = CmpStr.create().setProcessors( { phonetic: { algo: 'soundex' } } );
    expect( defaults.phoneticIndex( 'Robert' ) ).toBe( 'R163' );
  } );

  it( 'Cologne', () => {
    const cmp = CmpStr.create().setMetric( 'levenshtein' );
    const res = cmp.match( [ 'Meyer', 'Müller', 'Miller', 'Meyers', 'Meier' ], 'Maier', 0.8, {
      processors: { phonetic: { algo: 'cologne' } }
    } );

    expect( res ).toHaveLength( 2 );
  } );

  it( 'Metaphone', () => {
    const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'metaphone' } } );
    const res = cmp.phoneticIndex(
      'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
      'in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his ' +
      'head a little he could see his brown belly, slightly domed and divided by arches into ' +
      'stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any ' +
      'moment. His many legs, pitifully thin compared with the size of the rest of him, waved ' +
      'about helplessly as he looked.'
    );

    expect( res ).toMatch( /^ON MRNNK EN KRKR SMS WK FRM TRBLT TRM(.+)/ );
  } );

  it( 'Caverphone', () => {
    const cmp = CmpStr.create().setProcessors( { phonetic: { algo: 'caverphone' } } );
    const res = cmp.phoneticIndex( 'Thompson' );

    expect( res ).toBe( 'TMPSN11111' );
  } );

  it( 'Per-call options do not mutate instance options', () => {
    const cmp = CmpStr.create().setMetric( 'levenshtein' ).setProcessors( {
      phonetic: { algo: 'soundex', opt: { length: 4 } }
    } );

    expect( cmp.phoneticIndex( 'Robert' ) ).toBe( 'R163' );

    cmp.compare( 'Robert', 'Rupert', { processors: {
      phonetic: { algo: 'soundex', opt: { length: 2 } }
    } } );

    expect( cmp.phoneticIndex( 'Robert' ) ).toBe( 'R163' );
  } );
} );
