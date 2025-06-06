/**
 * Filter Utility
 * src/utils/Filter.ts
 * 
 * This module provides a Filter class that allows for the management and application of
 * filters to strings based on hooks. Filters can be added, removed, paused, resumed, and
 * applied to input strings. Each filter has an id, a function, a priority, and options
 * for activation and overrideability.
 * 
 * @module Utils/Filter
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { FilterEntry, FilterFn, FilterOptions } from './Types';

/**
 * The Filter class provides a way to manage and apply filters to strings based on hooks.
 */
export class Filter {

    /**
     * A static map to hold all filters.
     * The key is the hook name, and the value is an array of FilterEntry objects.
     */
    private static filters: Map<string, FilterEntry[]> = new Map ();

    /**
     * Finds a filter by its hook and id.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {FilterEntry|undefined} - The FilterEntry if found, otherwise undefined
     */
    private static find ( hook: string, id: string ) : FilterEntry | undefined {

        return Filter.filters.get( hook )?.find( f => f.id === id );

    }

    /**
     * Adds a filter to the specified hook.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @param {FilterFn} fn - The filter function
     * @param {FilterOptions} options - Additional options for the filter
     * @returns {boolean} - Returns true if the filter was added, false if it was not added due to override restrictions
     */
    public static add (
        hook: string, id: string, fn: FilterFn,
        options: FilterOptions = {}
    ) : boolean {

        const { priority = 10, active = true, overrideable = true } = options;

        // Check if the filter already exists
        const filter: FilterEntry[] = Filter.filters.get( hook ) ?? [];
        const index: number = filter.findIndex( f => f.id === id );

        // If the filter already exists and is not overrideable, return false
        if ( index >= 0 ) {

            const f: FilterEntry = filter[ index ];

            if ( ! f.overrideable ) return false;

            filter.splice( index, 1 );

        }

        // Add the new filter entry
        filter.push( { id, fn, priority, active, overrideable } );

        // Sort the filters by priority
        filter.sort( ( a, b ) => a.priority - b.priority );

        // Update the filters map
        Filter.filters.set( hook, filter );

        return true;

    }

    /**
     * Removes a filter by its hook and id.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter was removed, false if it was not found
     */
    public static remove ( hook: string, id: string ) : boolean {

        // Get the filter array for the specified hook
        const filter: FilterEntry[] | undefined = Filter.filters.get( hook );

        // If the filter array does not exist, return false
        if ( ! filter ) return false;

        // Find the index of the filter with the specified id
        const index: number = filter.findIndex( f => f.id === id );

        // If the filter is found, remove it and return true
        if ( index >= 0 ) {

            filter.splice( index, 1 );

            return true;

        }

        return false;

    }

    /**
     * Pauses a filter by its hook and id.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter was paused, false if it was not found
     */
    public static pause ( hook: string, id: string ) : boolean {

        // Find the filter entry by hook and id
        const f: FilterEntry | undefined = Filter.find( hook, id );

        if ( ! f ) return false;

        // Set the active property to false to pause the filter
        f.active = false;

        return true;

    }

    /**
     * Resumes a filter by its hook and id.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} id - The id of the filter
     * @returns {boolean} - Returns true if the filter was resumed, false if it was not found
     */
    public static resume ( hook: string, id: string ) : boolean {

        // Find the filter entry by hook and id
        const f: FilterEntry | undefined = Filter.find( hook, id );

        if ( ! f ) return false;

        // Set the active property to true to resume the filter
        f.active = true;

        return true;

    }

    /**
     * Lists all filters for a given hook.
     * 
     * @param {string} hook - The name of the hook
     * @param {boolean} active - If true, only list active filters
     * @returns {string[]} - An array of filter ids
     */
    public static list ( hook: string, active: boolean = false ) : string[] {

        // Get the filter array for the specified hook
        const filter: FilterEntry[] = Filter.filters.get( hook ) ?? [];

        const list: string[] = [];

        // If active is true, filter the entries based on their active status
        for ( const f of filter ) if ( ! active || f.active ) list.push( f.id );

        return list;

    }

    /**
     * Applies all active filters for a given hook to the input string.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} input - The input string to be filtered
     * @returns {string} - The filtered input string
     */
    public static apply ( hook: string, input: string ) : string {

        // Get the filter array for the specified hook
        const filter: FilterEntry[] | undefined = Filter.filters.get( hook );

        // If no filters are found for the hook or if no filters are active, return the input unchanged
        if ( ! filter || filter.every( f => ! f.active ) ) return input;

        let res: string = input;

        // Apply each active filter function to the input string
        for ( const f of filter ) if ( f.active ) res = f.fn( res );

        return res;

    }

    /**
     * Applies all active filters for a given hook to the input string asynchronously.
     * Each filter function may return a Promise or a plain string; all are awaited in order.
     * 
     * @param {string} hook - The name of the hook
     * @param {string} input - The input string to be filtered
     * @returns {Promise<string>} - The filtered input string
     */
    public static async applyAsync ( hook: string, input: string ) : Promise<string> {

        // Get the filter array for the specified hook
        const filter: FilterEntry[] | undefined = Filter.filters.get( hook );

        // If no filters are found for the hook or if no filters are active, return the input unchanged
        if ( ! filter || filter.every( f => ! f.active ) ) return input;

        let res: string = input;

        // Apply each active filter function to the input string, awaiting each result
        // Support both sync and async filter functions
        for ( const f of filter ) if ( f.active ) res = await Promise.resolve( f.fn( res ) );

        return res;
    }

    /**
     * Clears all filters or filters for a specific hook.
     * 
     * @param {string} [hook] - Optional name of the hook to clear filters for
     */
    public static clear ( hook?: string ) : void {

        // If a specific hook is provided, delete its filters
        if ( hook ) Filter.filters.delete( hook );

        // If no hook is provided, clear all filters
        else Filter.filters.clear();

    }

}