import { describe, it, expect } from 'vitest';
import { CmpStr, DiffChecker, Normalizer, TextAnalyzer } from '../src';

/**
 * Tools Test Suite for CmpStr
 * 
 * These tests validate the functionality of various utility tools
 * provided by the CmpStr library, including Normalizer, TextAnalyzer,
 * and DiffChecker.
 */
describe( 'CmpStr > Tools', () => {

    it( 'Similarity Matrix', () => {

        const cmp = CmpStr.create().setMetric( 'dice' );
        const res = cmp.matrix( [ 'hallo', 'hello', 'hi', 'hola', 'hey' ] );

        expect( res ).toEqual( [
            [ 1, 0.5, 0, 0, 0 ],
            [ 0.5, 1, 0, 0, 1/3 ],
            [ 0, 0, 1, 0, 0 ],
            [ 0, 0, 0, 1, 0 ],
            [ 0, 1/3, 0, 0, 1 ]
        ] );

    } );

    it( 'Normalizer', () => {

        const res = Normalizer.normalize( 'Some teXt   to NORma22lize', 'iwn' );

        expect( res ).toBe( 'some text to normalize' );

    } );

    it( 'Text Analyzer', () => {

        const analyze = new TextAnalyzer (
            'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
            'in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment. His many legs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.'
        );

        expect( analyze.getSentenceCount() ).toBe( 4 );

        expect( analyze.getAvgSentenceLength() ).toBeCloseTo( 21.5 );

        expect( analyze.getMostCommonWords() ).toEqual( [ 'he', 'his', 'and', 'the', 'into' ] );

        expect( analyze.getReadingTime() ).toBeGreaterThan( 0 );

        expect( analyze.hasNumbers() ).toBeFalsy();

    } );

    it( 'Diff Checker', () => {

        const diff = new DiffChecker (
            'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed ' +
            'in his bed into a horrible vermin.\nHe lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections.\nThe bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment.\nHis many legs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.',
            'One morning, when Gregor Samsa woke up from troubled dreams, he found himself transformed ' +
            'in his bed into a terrifying vermin.\nHe lay on his armour-like back, and if he lifted his ' +
            'head a little he could see his brown belly, slightly domed and divided by arches into ' +
            'stiff sections.\nThe bedding was hardly able to cover it and seemed ready to slide off any ' +
            'moment.\nHis many limbs, pitifully thin compared with the size of the rest of him, waved ' +
            'about helplessly as he looked.'
        );

        const res = diff.getStructuredDiff();

        expect( res ).toBeTypeOf( 'object' );

        expect( res[0].totalSize ).toBeGreaterThan( 0 );

        expect( res[0].diffs[0].ins ).toBe( 'up' );

        expect( diff.getASCIIDiff() ).toBeDefined();

    } );

    it( 'Empty Strings Diff', () => {

        const diff = new DiffChecker( '', '' );
        const res = diff.getStructuredDiff();

        expect( res ).toEqual( [] );

    } );

    it( 'Identical Strings Diff', () => {

        const diff = new DiffChecker( 'test', 'test' );
        const res = diff.getStructuredDiff();

        expect( res ).toEqual( [] );

    } );

    it( 'Completely Different Strings Diff', () => {

        const diff = new DiffChecker( 'abc', 'xyz' );
        const res = diff.getStructuredDiff();

        expect( res.length ).toBeGreaterThan( 0 );

    } );

    it( 'Text Analyzer Edge Cases', () => {

        const emptyAnalyze = new TextAnalyzer( '' );
        expect( emptyAnalyze.getSentenceCount() ).toBe( 0 );

        const numbersAnalyze = new TextAnalyzer( 'Test with 12345 numbers.' );
        expect( numbersAnalyze.hasNumbers() ).toBeTruthy();

        const singleWordAnalyze = new TextAnalyzer( 'Word' );
        expect( singleWordAnalyze.getSentenceCount() ).toBeGreaterThan( 0 );

    } );

    it( 'Normalizer with Different Flags', () => {

        const text = 'HELLO World 123!';

        expect( Normalizer.normalize( text, 'i' ) ).toBe( 'hello world 123!' );
        expect( Normalizer.normalize( text, 'n' ) ).toBe( 'HELLO World !' );
        expect( Normalizer.normalize( text, 'w' ) ).toBe( 'HELLO World 123!' );

    } );

    it( 'Matrix with Single String', () => {

        const cmp = CmpStr.create( { metric: 'levenshtein' } );
        const res = cmp.matrix( [ 'test' ] );

        expect( res ).toHaveLength( 1 );
        expect( res[ 0 ] ).toHaveLength( 1 );
        expect( res[ 0 ][ 0 ] ).toBe( 1 );

    } );

    it( 'Search with Empty Haystack', () => {

        const cmp = CmpStr.create();
        const res = cmp.search( 'needle', [] );

        expect( res ).toEqual( [] );

    } );

    it( 'Search Finds Matches', () => {

        const cmp = CmpStr.create( { metric: 'dice', flags: 'i' } );
        const res = cmp.search( 'test', [ 'test', 'testing', 'best', 'nest', 'rest', 'xyz' ] );

        expect( res.length ).toBeGreaterThan( 0 );
        expect( res ).toContain( 'test' );

    } );

} );
