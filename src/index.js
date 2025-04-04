module.exports = class CmpStr {

    #register = {
        levenshtein: require( './algorithms/levenshtein' )
    };

    string;
    flags = '';
    algo;

    addAlgo ( algo, callback, useIt = true ) {

        if (
            !this.isAlgo( algo ) &&
            typeof callback === 'function' &&
            callback.length == 2 &&
            typeof callback.apply( null, [ 'abc', 'abc' ] ) === 'number'
        ) {

            this.#register[ algo ] = callback;

            if ( useIt ) {

                this.setAlgo( algo );

            }

        } else {

            throw new Error ( 'the algorithm could not be added' );

        }

    };

    setStr ( str ) {

        this.string = String( str );

    };

    setAlgo ( algo ) {

        if ( this.isAlgo( algo ) ) {

            this.algo = algo;

        } else {

            throw new Error ( algo + ' is not defined' );

        }

    };

    isAlgo ( algo ) {

        return algo in this.#register;

    };

    test ( str ) {

        return this.#register[ this.algo ].apply(
            null, [ this.string, String( str ) ]
        );

    };

    closest ( arr ) {

        let best = -Infinity,
            idx = 0, pct;

        /* search for closest element in arr */

        [ ...arr ].forEach( ( str, i ) => {

            pct = this.test( str );

            if( pct > best ) {

                /* save closest target */

                best = pct;
                idx = i;

            }

        } );

        /* return closest target */

        return arr[ idx ];

    };

    match ( arr, threshold = 0 ) {

        let matches = [],
            pct;

        /* calculate similarity for each item in arr */

        [ ...arr ].forEach( ( str ) => {

            pct = this.test( str );

            if( pct >= threshold ) {

                matches.push( {
                    target: str, match: pct,
                    fromTh: pct - threshold
                } );

            }

        } );

        /* sort by highest similarity */

        let sorted = matches.sort(
            ( a, b ) => b.match - a.match
        );

        /* return sorted matches */

        return sorted;

    };

};