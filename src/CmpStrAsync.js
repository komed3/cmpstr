'use strict';

const CmpStr = require( './CmpStr' );

module.exports = class CmpStrAsync extends CmpStr {

    constructor ( algo = undefined, str = undefined ) {

        super ( algo, str );

    };

    compareAsync ( algo, a, b, flags = '', ...args ) {

        return new Promise ( ( resolve, reject ) => {

            setImmediate( () => {

                try {

                    resolve( this.compare(
                        algo, a, b, flags, ...args
                    ) );

                } catch ( err ) {

                    reject( err );

                }

            } );

        } );

    };

    testAsync ( str, flags = '', ...args ) {

        if ( this.isReady() ) {

            return new Promise ( ( resolve, reject ) => {

                setImmediate( () => {

                    try {

                        resolve( this.test(
                            str, flags, ...args
                        ) );

                    } catch ( err ) {

                        reject( err );

                    }

                } );

            } );

        }

    };

    batchTestAsync ( arr, flags = '', ...args ) {

        if ( this.isReady() ) {

            let tasks = [ ...arr ].map( ( str ) => {

                return new Promise ( ( resolve, reject ) => {

                    setImmediate( () => {

                        try {

                            resolve( {
                                target: str,
                                match: this.test(
                                    str, flags, ...args
                                )
                            } );

                        } catch ( err ) {

                            reject( err );

                        }

                    } );

                } );

            } );

            return Promise.all( tasks );

        }

    };

    async matchAsync ( arr, flags = '', threshold = 0, ...args ) {

        if ( this.isReady() ) {

            let res = await this.batchTestAsync(
                arr, flags, ...args
            );

            return res.filter(
                ( r ) => r.match >= threshold
            ).sort(
                ( a, b ) => b.match - a.match
            );

        }

    };

    async closestAsync ( arr, flags = '', ...args ) {

        if ( this.isReady() ) {

            let res = await this.matchAsync(
                arr, flags, 0, ...args
            );

            return res.length
                ? res[0].target
                : undefined;

        }

    };

    similarityMatrixAsync ( algo, arr, flags = '', ...args ) {

        if ( this.loadAlgo( algo ) ) {

            let tasks = [ ...arr ].map( ( a, i ) => {

                return Promise.all( [ ...arr ].map( ( b, j ) => {

                    return new Promise ( ( resolve, reject ) => {

                        setImmediate( () => {

                            try {

                                resolve( i === j ? 1 : this.compare(
                                    algo, a, b, flags, ...args
                                ) );

                            } catch ( err ) {

                                reject( err );

                            }

                        } );

                    } );

                } ) );

            } );

            return Promise.all( tasks );

        }

    };

};