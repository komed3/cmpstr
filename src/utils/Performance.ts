/**
 * Performance Utility
 * src/utils/Performance.ts
 * 
 * The Perf class provides a lightweight and cross-platform way to measure
 * elapsed time and memory usage for code sections or algorithm runs.
 * It is designed to work in both Node.js and browser environments, using
 * only built-in APIs. The class is optimized for minimal overhead and
 * can be used for fine-grained performance profiling.
 * 
 * Usage:
 *   const perf = new Perf ();
 *   // ... code to measure ...
 *   const stats = perf.get(); // { time, mem }
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @package CmpStr
 * @since 3.0.0
 */

'use strict';

import type { Performance } from './Types';
import { Helper } from './Helper';

/**
 * Perf class for measuring elapsed time and memory usage.
 */
export class Perf {

    private time: number;
    private mem: number;

    /**
     * Returns the current memory usage in bytes.
     * Uses process.memoryUsage().heapUsed in Node.js, navigator.deviceMemory
     * (approximate, in browsers), or 0 if unavailable.
     * 
     * @private
     * @returns {number} - Memory usage in bytes
     */
    private _mem () : number {

        if ( typeof process !== 'undefined' && process.memoryUsage ) {

            return process.memoryUsage().heapUsed;

        }

        else if ( typeof navigator !== 'undefined' && 'deviceMemory' in navigator ) {

            return ( navigator as any ).deviceMemory * 1024 * 1024 * 1024;

        }

        return 0;

    }

    /**
     * Constructs a Perf instance and stores the current time and memory usage.
     * 
     * @constructor
     */
    constructor () {

        this.set();

    }

    /**
     * Resets the start time and memory usage to the current values.
     */
    public set () : void {

        this.time = Helper.now();
        this.mem = this._mem();

    }

    /**
     * Returns the elapsed time (ms) and memory usage (bytes) since the
     * last set or construction. Also resets the start values for the
     * next measurement.
     * 
     * @returns {Performance} - Object with time (ms) and mem (bytes) difference
     */
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