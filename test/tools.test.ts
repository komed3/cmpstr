import { describe, it, expect } from 'vitest';
import { CmpStr, DiffChecker, Normalizer, TextAnalyzer } from '../src';

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

} );
