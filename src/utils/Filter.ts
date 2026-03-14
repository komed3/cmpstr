/**
 * Filter Utility
 * src/utils/Filter.ts
 * 
 * This module provides a Filter class that allows for the management and application of
 * filters to strings based on hooks. Filters can be added, removed, paused, resumed, and
 * applied to input strings. Each filter has an id, a function, a priority, and options
 * for activation and overrideability.
 * 
 * @module Utils
 * @name Filter
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { FilterEntry, FilterFn, FilterHooks, FilterOptions } from './Types';
import { ErrorUtil } from './Errors';


/**
 * The Filter class provides a way to manage and apply filters to strings based on hooks.
 */
export class Filter {

    /** Filter function that returns the input string unchanged */
    private static readonly IDENTITY: FilterFn = s => s;

    /**
     * A static map to hold all filters.
     * The key is the hook name, and the value is an Map of FilterEntry objects.
     */
    private static filters: Map< FilterHooks, Map< string, FilterEntry > > = new Map ();

    /**
     * A map that holds the pipeline of filters to be applied.
     * The key is the hook name, and the value is the compiled function.
     */
    private static pipeline: Map< FilterHooks, FilterFn > = new Map ();

    /**
     * Retrieves the compiled filter function for a given hook.
     * If the function is not cached, it compiles it from the active filters.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @returns {FilterFn} - The compiled filter function for the hook
     * @throws {CmpStrInternalError} - Throws an error if the pipeline compilation fails
     */
    private static getPipeline ( hook: FilterHooks ) : FilterFn {
        return ErrorUtil.wrap< FilterFn >( () => {
            // Return the cached pipeline if it exists
            const cached = Filter.pipeline.get( hook );
            if ( cached ) return cached;

            // Get the filters for the specified hook
            const filter = Filter.filters.get( hook );

            // If no filters exist for the hook, cache and return the identity function
            if ( ! filter ) {
                Filter.pipeline.set( hook, Filter.IDENTITY );
                return Filter.IDENTITY;
            }

            // Compile the pipeline from active filters sorted by priority
            const pipeline: FilterEntry[] = [];

            for ( const f of filter.values() ) if ( f.active ) pipeline.push( f );
            pipeline.sort( ( a, b ) => a.priority - b.priority );

            const fn: FilterFn = ( input: string ) => {
                let v = input;
                for ( let i = 0; i < pipeline.length; i++ ) v = pipeline[ i ].fn( v );

                return v;
            };

            // Cache and return the compiled pipeline
            Filter.pipeline.set( hook, fn );
            return fn;
        }, `Error compiling filter pipeline for hook <${hook}>`, { hook } );
    }

    /**
     * Checks if a filter exists for a given hook and id.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter exists, false otherwise
     */
    public static has ( hook: FilterHooks, id: string ) : boolean {
        return !! ( Filter.filters.get( hook )?.has( id ) );
    }

    /**
     * Adds a filter to the specified hook.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @param {FilterFn} fn - The filter function
     * @param {FilterOptions} [opt] - Additional options for the filter
     * @returns {boolean} - Returns true if the filter was added,
     *                      false if it was not added due to override restrictions
     * @throws {CmpStrInternalError} - Throws an error if there is an issue adding the filter
     */
    public static add (
        hook: FilterHooks, id: string, fn: FilterFn, opt: FilterOptions = {}
    ) : boolean {
        return ErrorUtil.wrap< boolean >( () => {
            const { priority = 10, active = true, overrideable = true } = opt;

            // Check if the filter already exists
            const filter = Filter.filters.get( hook ) ?? new Map< string, FilterEntry >();
            const index = filter.get( id );

            // If the filter already exists and is not overrideable, return false
            if ( index && ! index.overrideable ) return false;

            // Add or update the filter entry
            filter.set( id, { id, fn, priority, active, overrideable } );
            Filter.filters.set( hook, filter );
            Filter.pipeline.delete( hook );
            return true;
        }, `Error adding filter <${id}> to hook <${hook}>`, { hook, id, opt } );
    }

    /**
     * Removes a filter by its hook and id.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter was removed, false if it was not found
     */
    public static remove ( hook: FilterHooks, id: string ) : boolean {
        Filter.pipeline.delete( hook );
        const filter = Filter.filters.get( hook );
        return filter ? filter.delete( id ) : false;
    }

    /**
     * Pauses a filter by its hook and id.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter was paused, false if it was not found
     */
    public static pause ( hook: FilterHooks, id: string ) : boolean {
        Filter.pipeline.delete( hook );
        const f = Filter.filters.get( hook )?.get( id );
        return !! ( f && ( f.active = false, true ) );
    }

    /**
     * Resumes a filter by its hook and id.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter was resumed, false if it was not found
     */
    public static resume ( hook: FilterHooks, id: string ) : boolean {
        Filter.pipeline.delete( hook );
        const f = Filter.filters.get( hook )?.get( id );
        return !! ( f && ( f.active = true, true ) );
    }

    /**
     * Lists all filters for a given hook.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {boolean} active - If true, only list active filters
     * @returns {string[]} - An array of filter ids
     */
    public static list ( hook: FilterHooks, active: boolean = false ) : string[] {
        const filter = Filter.filters.get( hook );
        if ( ! filter ) return [];

        const out: string[] = [];
        for ( const f of filter.values() ) if ( ! active || f.active ) out.push( f.id );
        return out;
    }

    /**
     * Applies all active filters for a given hook to the input string(s).
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string | string[]} input - The input string(s) to be filtered
     * @returns {string | string[]} - The filtered string(s)
     * @throws {CmpStrInternalError} - Throws an error if there is an issue applying the filters
     */
    public static apply ( hook: FilterHooks, input: string | string[] ) : string | string[] {
        return ErrorUtil.wrap< string | string[] >( () => {
            const fn = Filter.getPipeline( hook );
            return Array.isArray( input ) ? input.map( fn ) : fn( input );
        }, `Error applying filters for hook <${hook}>`, { hook, input } );
    }

    /**
     * Applies all active filters for a given hook to the input string(s) asynchronously.
     * Each filter function may return a Promise or a plain string; all are awaited in order.
     * 
     * @param {FilterHooks} hook - The name of the hook
     * @param {string | string[]} input - The input string(s) to be filtered
     * @returns {Promise< string | string[] >} - The filtered string(s)
     * @throws {CmpStrInternalError} - Throws an error if there is an issue applying the filters
     */
    public static async applyAsync (
        hook: FilterHooks, input: string | string[]
    ) : Promise< string | string[] > {
        return ErrorUtil.wrapAsync< string | string[] >( async () => {
            const fn = Filter.getPipeline( hook );
            return Array.isArray( input )
                ? Promise.all( input.map( fn ) )
                : Promise.resolve( fn( input ) );
        }, `Error applying filters for hook <${hook}>`, { hook, input } );
    }

    /**
     * Clears all filters or filters for a specific hook.
     * If no hook is provided, clear all filters
     * 
     * @param {FilterHooks} [hook] - Optional name of the hook to clear filters for
     */
    public static clear ( hook?: FilterHooks ) : void {
        Filter.pipeline.clear();
        if ( hook ) Filter.filters.delete( hook );
        else Filter.filters.clear();
    }

    /**
     * Clears the entire filter pipeline cache.
     * This forces recompilation of all pipelines on next application.
     */
    public static clearPipeline () : void {
        Filter.pipeline.clear();
    }

}
