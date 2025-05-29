/**
 * Performance Utility
 * src/utils/Performance.ts
 * 
 * This class provides methods to measure performance in both Node.js and browser
 * environments. It supports singleton pattern to ensure only one instance is used
 * throughout the application. The class is optimized for minimal overhead and can
 * be used for fine-grained performance profiling.
 * 
 * @module Performance
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { PerfMeasure } from './Types';

/**
 * Performance utility class for measuring time and memory usage.
 */
export class Perf {

    // Environment detection
    private static ENV: 'nodejs' | 'browser' | 'unknown';

    // Singleton instance
    private static instance: Perf;

    // Last measured time and memory
    private lastTime: number;
    private lastMemory: number;

    // Start time and memory for total measurement
    private startTime: number;
    private startMemory: number;

    /**
     * Sets the environment based on the available global objects.
     * Detects if running in Node.js or browser and sets the ENV property accordingly.
     */
    public static setEnv () : void {

        // Check for Node.js environment
        if ( typeof process !== 'undefined' ) Perf.ENV = 'nodejs';

        // Check for browser environment
        else if ( typeof performance !== 'undefined' ) Perf.ENV = 'browser';

        // If neither, set ENV to unknown
        else Perf.ENV = 'unknown';

    }

    /**
     * Private constructor to enforce singleton pattern.
     * Initializes the last time and memory measurements.
     */
    private constructor () {

        this.reset();

    }

    /**
     * Sets the current time based on the environment.
     * Uses process.hrtime.bigint() for Node.js, performance.now() for browsers,
     * and Date.now() as a fallback.
     * 
     * @returns {number} - Current time in milliseconds or nanoseconds
     */
    private setTime () : number {

        switch ( Perf.ENV ) {

            // Node.js environment
            case 'nodejs':
                return this.lastTime = Number( process.hrtime.bigint() ) / 1e6;

            // Browser environment
            case 'browser':
                return this.lastTime = ( performance as any ).now();

            // Fallback
            default:
                return this.lastTime = Date.now();

        }

    }

    /**
     * Sets the current memory usage based on the environment.
     * Uses process.memoryUsage().heapUsed for Node.js, performance.memory.usedJSHeapSize
     * for browsers, and returns 0 as a fallback.
     * 
     * @returns {number} - Current memory usage in bytes
     */
    private setMemory () : number {

        switch ( Perf.ENV ) {

            // Node.js environment
            case 'nodejs':
                return this.lastMemory = process.memoryUsage().heapUsed;

            // Browser environment
            case 'browser':
                return this.lastMemory = ( performance as any ).memory?.usedJSHeapSize ?? 0;

            // Fallback
            default:
                return this.lastMemory = 0;

        }

    }

    /**
     * Returns the singleton instance of the Perf class.
     * If the instance does not exist, it creates a new one.
     * 
     * @param {boolean} reset - If true, resets the time and memory measurements
     * @returns {Perf} - Singleton instance of the Perf class
     */
    public static getInstance ( reset: boolean = false ) : Perf {

        // Ensure the environment is set
        if ( ! Perf.ENV ) Perf.setEnv();

        // If instance does not exist, create a new one
        if ( ! Perf.instance ) return Perf.instance = new Perf ();

        // If reset is true, reset the time and memory measurements
        if ( reset ) Perf.instance.reset();

        return Perf.instance;

    }

    /**
     * Get a performance measurement and resetting the last time and memory.
     * 
     * @returns {PerfMeasure} - Object containing time and memory measurements
     */
    public measure () : PerfMeasure {

        const time = this.lastTime;
        const memory = this.lastMemory;

        return {
            time: this.setTime() - time,
            memory: this.setMemory() - memory
        };

    }

    /**
     * Measures the total time and memory since the last reset.
     * 
     * @returns {PerfMeasure} - Object containing time and memory measurements
     */
    public measureTotal () : PerfMeasure {

        return {
            time: this.setTime() - this.startTime,
            memory: this.setMemory() - this.startMemory
        }

    }

    /**
     * Resets the start time and memory to the current values.
     * This is useful for measuring performance over a specific period.
     */
    public reset () : void {

        this.startTime = this.setTime();
        this.startMemory = this.setMemory();

    }

}