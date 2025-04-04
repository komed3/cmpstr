module.exports = class CmpStr {

    register = [ 'levenshtein', 'dice' ];

    string;
    flags = '';
    algo;

    register ( algo ) {

        //

    };

    setStr ( str ) {

        this.string = String( str );

    };

    setAlgorithm ( algo ) {

        if ( this.isAlgorithm( algo ) ) {

            this.algo = algo;

        } else {

            throw new Error ( algo + ' is not defined' );

        }

    };

    isAlgorithm ( algo ) {

        return this.register.includes( algo );

    };

    test ( str ) {



    };

};