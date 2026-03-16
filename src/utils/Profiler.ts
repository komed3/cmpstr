/**
 * Profiler Utility
 * src/utils/Profiler.ts
 * 
 * @see https://en.wikipedia.org/wiki/Profiling_(computer_programming)
 * 
 * This class provides methods to run synchronous and asynchronous functions, capturing
 * their execution time and memory usage, and storing the results in a set of profiler
 * entries. It supports both Node.js and browser environments, detecting the environment
 * automatically.
 * 
 * The class is optimized for minimal overhead and can be used for fine-grained
 * performance profiling.
 * 
 * @module Utils
 * @name Profiler
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { ProfilerEntry, ProfilerService } from './Types';


/**
 * Profiler class for measuring execution time and memory usage of functions.
 */
export class Profiler {

    /** Environment detection */
    private static ENV: 'nodejs' | 'browser' | 'unknown';

    /** Singleton instance */
    private static instance: Profiler;

    /** Pre-computed functions for time and memory retrieval */
    private nowFn: () => number;
    private memFn: () => number;

    /** Store for profiler entries */
    private store: ProfilerEntry< any >[] = [];
    private last?: ProfilerEntry< any >;

    /** Total time and memory consumption */
    private totalTime: number = 0;
    private totalMem: number = 0;

    /**
     * Sets the environment based on the available global objects.
     * Detects if running in Node.js or browser and sets the ENV property accordingly.
     */
    protected static detectEnv () : void {
        if ( typeof process !== 'undefined' && process.versions?.node ) Profiler.ENV = 'nodejs';
        else if ( typeof performance !== 'undefined' ) Profiler.ENV = 'browser';
        else Profiler.ENV = 'unknown';
    }

    /**
     * Returns the singleton instance of the Profiler class.
     * If the instance does not exist, it creates a new one.
     * 
     * @param {boolean} [enable=false] - Optional parameter to enable the profiler upon instantiation
     * @returns {Profiler} - Singleton Profiler instance
     */
    public static getInstance ( enable?: boolean ) : Profiler {
        if ( ! Profiler.ENV ) Profiler.detectEnv();
        return Profiler.instance ||= new Profiler ( enable );
    }

    /**
     * Private constructor to enforce singleton pattern.
     * Initializes the store for profiler entries.
     * 
     * @param {boolean} [active=false] - Optional parameter to enable the profiler
     */
    private constructor ( private active: boolean = false ) {
        switch ( Profiler.ENV ) {
            case 'nodejs':
                this.nowFn = () => Number( process.hrtime.bigint() ) / 1e6;
                this.memFn = () => process.memoryUsage().heapUsed;
                break;
            case 'browser':
                this.nowFn = () => performance.now();
                this.memFn = () => ( performance as any ).memory?.usedJSHeapSize ?? 0;
                break;
            default:
                this.nowFn = () => Date.now();
                this.memFn = () => 0;
                break;
        }
    }

    /**
     * Profiles a synchronous function by measuring its execution time and memory usage.
     * 
     * @param {() => T} fn - Function to be executed and profiled
     * @param {Record< string, any >} meta - Metadata to be associated with the profiling entry
     * @returns {T} - The result of the executed function
     */
    private profile< T > ( fn: () => T, meta: Record< string, any > ) : T {
        const startTime = this.nowFn(), startMem  = this.memFn();

        // Execute the function and capture the result
        const res = fn();

        // Calculate the time and memory consumption
        const deltaTime = this.nowFn() - startTime, deltaMem  = this.memFn() - startMem;

        // Add the profiling entry to the store
        const entry: ProfilerEntry< T > = { time: deltaTime, mem: deltaMem, res, meta };
        this.store.push( entry ); this.last = entry;
        this.totalTime += deltaTime, this.totalMem += deltaMem;

        return res;
    }


    /**
     * Enables the profiler.
     * Sets the active state to true, allowing profiling to occur.
     */
    public enable () : void {
        this.active = true
    }

    /**
     * Disables the profiler.
     * Sets the active state to false, preventing further profiling.
     */
    public disable () : void {
        this.active = false
    }

    /**
     * Resets the profiler by clearing the store, total time and memory consumption.
     * This method is useful for starting a new profiling session.
     */
    public clear () : void {
        this.store = [];
        this.totalTime = 0;
        this.totalMem = 0;
    }

    /**
     * Runs a synchronous function and profiles its execution time and memory usage.
     * If the profiler is not active, it simply executes the function without profiling.
     * 
     * @param {() => T} fn - Function to be executed and profiled
     * @param {Record< string, any >} meta - Metadata to be associated with the profiling entry
     * @returns {T} - The result of the executed function
     */
    public run< T > ( fn: () => T, meta: Record< string, any > = {} ) : T {
        return this.active ? this.profile( fn, meta ) : fn();
    }

    /**
     * Runs an asynchronous function and profiles its execution time and memory usage.
     * If the profiler is not active, it simply executes the function without profiling.
     * 
     * @param {() => Promise< T >} fn - Asynchronous function to be executed and profiled
     * @param {Record< string, any >} meta - Metadata to be associated with the profiling entry
     * @returns {Promise< T >} - A promise that resolves to the result of the executed function
     */
    public async runAsync< T > ( fn: () => Promise< T >, meta: Record< string, any > = {} ) : Promise< T > {
        return this.active ? this.profile( async () => await fn(), meta ) : await fn();
    }

    /**
     * Retrieves all profiler entries stored in the profiler.
     * 
     * @returns {ProfilerEntry< any >[]} - An array of profiler entries
     */
    public getAll () : ProfilerEntry< any >[] {
        return this.store;
    }

    /**
     * Retrieves the last profiler entry stored in the profiler.
     * 
     * @returns {ProfilerEntry< any > | undefined} - The last profiler entry or undefined if no entries exist
     */
    public getLast () : ProfilerEntry< any > | undefined {
        return this.last;
    }

    /**
     * Retrieves the total time and memory consumption recorded by the profiler.
     * 
     * @returns {{ time: number, mem: number }} - An object containing total time and memory usage
     */
    public getTotal () : { time: number, mem: number } {
        return { time: this.totalTime, mem: this.totalMem };
    }

    /**
     * Returns the services provided by the Profiler class.
     * This allows for easy access to the profiler's methods.
     * 
     * @returns {ProfilerService< any >} - An object containing methods to control the profiler
     */
    public services: ProfilerService< any > = Object.freeze( {
        enable: this.enable.bind( this ),
        disable: this.disable.bind( this ),
        clear: this.clear.bind( this ),
        report: this.getAll.bind( this ),
        last: this.getLast.bind( this ),
        total: this.getTotal.bind( this )
    } );

}
