'use strict';

import type { Performance } from './Types';

export class Perf {

    private time: number;
    private mem: number;

    private _time () : number {

        if ( typeof performance !== 'undefined' && typeof performance.now === 'function' ) {

            return performance.now();

        }

        return Date.now();

    }

    private _mem () : number {

        if ( typeof process !== 'undefined' && process.memoryUsage ) {

            return process.memoryUsage().heapUsed;

        }

        else if ( typeof navigator !== 'undefined' && 'deviceMemory' in navigator ) {

            return ( navigator as any ).deviceMemory * 1024 * 1024 * 1024;

        }

        return 0;

    }

    constructor () {

        this.set();

    }

    public set () : void {

        this.time = this._time();
        this.mem = this._mem();

    }

    public get () : Performance {

        const time = this.time;
        const mem = this.mem;

        this.set();

        return {
            time: this.time - time,
            mem: this.mem - mem
        };

    }

};