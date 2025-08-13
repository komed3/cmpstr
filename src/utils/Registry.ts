/**
 * Registry Utility
 * src/utils/Registry.ts
 * 
 * This module provides a Registry function that allows for registering,
 * removing, checking, getting, and listing class constructors.
 * 
 * It is designed to manage class extensions, ensuring that all registered
 * classes extend a specified base constructor.
 * 
 * @module Utils/Registry
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { RegistryService, RegistryConstructor } from './Types';

/**
 * Global registry object to hold multiple registries.
 * Each registry is keyed by a string identifier.
 * 
 * @type {Record<string, RegistryService<any>>}
 */
export const registry: Record<string, RegistryService<any>> = Object.create( null );

/**
 * Factory object to hold factory functions for creating instances.
 * This is used to create instances of registered classes.
 * 
 * @type {Record<string, ( cls: string, ...args: any[] ) => InstanceType<any>>}
 */
export const factory: Record<string, ( cls: string, ...args: any[] ) => InstanceType<any>> = Object.create( null );

/**
 * Registry function to create a service for managing class constructors.
 * 
 * @param {string} reg - The name of the registry
 * @param {RegistryConstructor<T>} ctor - The base constructor that all registered classes must extend
 * @returns {RegistryService<T>} - An object with methods to register, remove, check, get, and list classes
 * @throws {Error} If the registry already exists (overwriting is forbidden)
 */
export function Registry<T> ( reg: string, ctor: RegistryConstructor<T> ) : RegistryService<T> {

    // Throws an error if the registry already exists
    if ( reg in registry || reg in factory ) throw new Error (
        `Registry <${reg}> already exists / overwriting is forbidden`
    );

    // Create a registry object to hold class constructors
    const classes: Record<string, RegistryConstructor<T>> = Object.create( null );

    const service: RegistryService<T> = {

        /**
         * Register a new extension of the base class.
         * 
         * @param {string} name - The name of the class to register
         * @param {RegistryConstructor<T>} cls - The class constructor
         * @param {boolean} [update=false] - Whether to allow overwriting an existing entry
         * @throws {TypeError} If the class does not extend the base constructor
         * @throws {Error} If the class name already exists and update is false
         */
        add ( name: string, cls: RegistryConstructor<T>, update: boolean = false ) : void {

            if ( ! ( cls.prototype instanceof ctor ) ) throw new TypeError (
                `Class must extend <${reg}>`
            );

            if ( ! update && name in classes ) throw new Error (
                `Entry <${name}> already exists / use <update=true> to overwrite`
            );

            classes[ name ] = cls;

        },

        /**
         * Remove a class from the registry.
         * 
         * @param {string} name - The name of the class to remove
         */
        remove ( name: string ) : void { delete classes[ name ] },

        /**
         * Check if a class is registered.
         * 
         * @param {string} name - The name of the class to check
         * @returns {boolean} - True if the class is registered, false otherwise
         */
        has ( name: string ) : boolean { return name in classes },

        /**
         * List all registered class names.
         * 
         * @returns {string[]} - An array of registered class names
         */
        list () : string[] { return Object.keys( classes ) },

        /**
         * Get a registered class by name.
         * 
         * @param {string} name - The name of the class to retrieve
         * @returns {RegistryConstructor<T>} - The class constructor
         * @throws {Error} If the class is not registered
         */
        get ( name: string ) : RegistryConstructor<T> {

            if ( ! ( name in classes ) ) throw new Error (
                `Class <${name}> not registered for <${reg}>`
            );

            return classes[ name ];

        }

    };

    // Register the service in the global registry
    registry[ reg ] = service;

    // Create a factory function for creating instances from the registry
    factory[ reg ] = ( cls: string, ...args: any[] ) : InstanceType<RegistryConstructor<T>> => (
        createFromRegistry<RegistryConstructor<T>>( reg, cls, ...args )
    );

    // Return the service object
    return service;

}

/**
 * Resolve a class constructor from a specific registry.
 * 
 * @param {string} reg - The name of the registry
 * @param {T|string} cls - The class itself or name of the class to resolve
 * @returns {T|undefined} - The class constructor if found, otherwise undefined
 * @throws {ReferenceError} If the registry does not exist
 */
export function resolveCls<T extends RegistryConstructor<any>> (
    reg: string, cls: T | string
) : T {

    if ( ! ( reg in registry ) ) throw new ReferenceError (
        `Registry <${reg}> does not exist`
    );

    return ( typeof cls === 'string' ? registry[ reg ]?.get( cls ) : cls ) as T;

}

/**
 * Create an instance of a class from a specific registry.
 * 
 * @param {string} reg - The name of the registry
 * @param {T|string} cls - The class itself or name of the class to instantiate
 * @param {...any} args - Arguments to pass to the class constructor
 * @returns {T} - An instance of the class
 * @throws {Error} If the class cannot be instantiated
 */
export function createFromRegistry<T extends RegistryConstructor<any>>(
    reg: string, cls: T | string, ...args: any[]
) : InstanceType<T> {

    cls = resolveCls<T>( reg, cls );

    try { return new ( cls as InstanceType<T> ) ( ...args ); }
    catch ( err ) { throw new Error ( `Cannot instantiate class <${cls}>`, {
        cause: err
    } ); }

}
