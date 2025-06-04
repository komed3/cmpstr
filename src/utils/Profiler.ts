/**
 * Profiler Utility
 * src/utils/profiler.ts
 * 
 * @see https://en.wikipedia.org/wiki/Profiling_(computer_programming)
 * 
 * This class provides methods to run synchronous and asynchronous functions, capturing
 * their execution time and memory usage, and storing the results in a set of profiler
 * entries. It supports both Node.js and browser environments, detecting the environment
 * automatically. The class is optimized for minimal overhead and can be used for fine-
 * grained performance profiling.
 * 
 * @module Utils/Profiler
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { ProfilerEntry } from './Types';

/**
 * Profiler class for measuring execution time and memory usage of functions.
 */
export class Profiler {

    // Environment detection
    private static ENV: 'nodejs' | 'browser' | 'unknown';

    // Singleton instance
    private static instance: Profiler;

    // Store for profiler entries
    private store: Set<ProfilerEntry<any>> = new Set ();

    // Total time and memory consumption
    private totalTime: number = 0;
    private totalMem: number = 0;

    // The Profiler active state
    private active: boolean;

    /**
     * Sets the environment based on the available global objects.
     * Detects if running in Node.js or browser and sets the ENV property accordingly.
     */
    protected static detectEnv () : void {

        // Check for Node.js environment
        if ( typeof process !== 'undefined' ) Profiler.ENV = 'nodejs';

        // Check for browser environment
        else if ( typeof performance !== 'undefined' ) Profiler.ENV = 'browser';

        // If neither, set ENV to unknown
        else Profiler.ENV = 'unknown';

    }

    /**
     * Returns the singleton instance of the Perf class.
     * If the instance does not exist, it creates a new one.
     * 
     * @param {boolean} [enable=false] - Optional parameter to enable the profiler upon instantiation
     * @returns {Profiler} - Singleton Profiler instance
     */
    public static getInstance ( enable?: boolean ) : Profiler {

        // Ensure the environment is detected
        if ( ! Profiler.ENV ) Profiler.detectEnv();

        // If instance does not exist, create a new one
        if ( ! Profiler.instance ) Profiler.instance = new Profiler ( enable );

        // Return singleton instance
        return Profiler.instance;

    }

    /**
     * Private constructor to enforce singleton pattern.
     * Initializes the store for profiler entries.
     * 
     * @param {boolean} [enable=false] - Optional parameter to enable the profiler
     */
    private constructor ( enable?: boolean ) { this.active = enable ?? false }

    /**
     * Gets the current time based on the environment.
     * 
     * Uses process.hrtime.bigint() for Node.js, performance.now() for browsers,
     * and Date.now() as a fallback.
     * 
     * @returns {number} - Current time in milliseconds
     */
    private now () : number {

        switch ( Profiler.ENV ) {

            // Node.js environment
            case 'nodejs': return Number( process.hrtime.bigint() ) / 1e6;
            // Browser environment
            case 'browser': return ( performance as any ).now();
            // Fallback
            default: return Date.now();

        }

    }

    /**
     * Gets the current memory usage based on the environment.
     * 
     * Uses process.memoryUsage().heapUsed for Node.js, performance.memory.usedJSHeapSize
     * for browsers, and returns 0 as a fallback.
     * 
     * @returns {number} - Current memory usage in bytes
     */
    private mem () : number {

        switch ( Profiler.ENV ) {

            // Node.js environment
            case 'nodejs': return process.memoryUsage().heapUsed;
            // Browser environment
            case 'browser': return ( performance as any ).memory?.usedJSHeapSize ?? 0;
            // Fallback
            default: return 0;

        }

    }

    /**
     * Enables the profiler.
     * Sets the active state to true, allowing profiling to occur.
     */
    public enable () : void { this.active = true }

    /**
     * Disables the profiler.
     * Sets the active state to false, preventing further profiling.
     */
    public disable () : void { this.active = false }

    /**
     * Resets the profiler by clearing the store, total time and memory consumption.
     * This method is useful for starting a new profiling session.
     */
    public clear () : void {

        this.store.clear();

        this.totalTime = 0;
        this.totalMem = 0;

    }

    /**
     * Runs a synchronous function and profiles its execution time and memory usage.
     * If the profiler is not active, it simply executes the function without profiling.
     * 
     * @param {() => T} fn - Function to be executed and profiled
     * @param {Record<string, any>} meta - Metadata to be associated with the profiling entry
     * @returns {T} - The result of the executed function
     */
    public run<T> ( fn: () => T, meta: Record<string, any> = {} ) : T {

        // If the profiler is not active, simply execute the function without profiling
        if ( ! this.active ) return fn();

        // Capture the start time and memory usage
        const startTime: number = this.now(), startMem: number = this.mem();

        // Execute the function and capture the result
        const res: T = fn();

        // Calculate the time and memory consumption
        const deltaTime: number = this.now() - startTime;
        const deltaMem: number = this.mem() - startMem;

        // Add the profiling entry to the store
        this.store.add( { time: deltaTime, mem: deltaMem, res, meta } );
        this.totalTime += deltaTime, this.totalMem += deltaMem;

        // Return the result of the function
        return res;

    }

    /**
     * Runs an asynchronous function and profiles its execution time and memory usage.
     * If the profiler is not active, it simply executes the function without profiling.
     * 
     * @param {() => Promise<T>} fn - Asynchronous function to be executed and profiled
     * @param {Record<string, any>} meta - Metadata to be associated with the profiling entry
     * @returns {Promise<T>} - A promise that resolves to the result of the executed function
     */
    public async runAsync<T> ( fn: () => Promise<T>, meta: Record<string, any> = {} ) : Promise<T> {

        // If the profiler is not active, simply execute the function without profiling
        if ( ! this.active ) return await fn();

        // Capture the start time and memory usage
        const startTime: number = this.now(), startMem: number = this.mem();

        // Execute the asynchronous function and wait for its result
        const res: Awaited<T> = await fn();

        // Calculate the time and memory consumption
        const deltaTime: number = this.now() - startTime;
        const deltaMem: number = this.mem() - startMem;

        // Add the profiling entry to the store
        this.store.add( { time: deltaTime, mem: deltaMem, res, meta } );
        this.totalTime += deltaTime, this.totalMem += deltaMem;

        // Return the result of the function
        return res;

    }

    /**
     * Retrieves all profiler entries stored in the profiler.
     * 
     * @returns {ProfilerEntry<any>[]} - An array of profiler entries
     */
    public getAll () : ProfilerEntry<any>[] { return [ ...this.store ] }

    /**
     * Retrieves the last profiler entry stored in the profiler.
     * 
     * @returns {ProfilerEntry<any> | undefined} - The last profiler entry or undefined if no entries exist
     */
    public getLast () : ProfilerEntry<any> | undefined { return this.getAll().pop() }

    /**
     * Retrieves the total time and memory consumption recorded by the profiler.
     * 
     * @returns {{ time: number, mem: number }} - An object containing total time and memory usage
     */
    public getTotal () : { time: number, mem: number } { return {
        time: this.totalTime, mem: this.totalMem
    } }

    /**
     * Returns the services provided by the Profiler class.
     * This allows for easy access to the profiler's methods.
     * 
     * @returns {Record<string, () => any>} - An object containing methods to control the profiler
     */
    public services: Record<string, () => any> = {
        enable: this.enable.bind( this ),
        disable: this.disable.bind( this ),
        clear: this.clear.bind( this ),
        report: this.getAll.bind( this ),
        last: this.getLast.bind( this ),
        total: this.getTotal.bind( this )
    };

}