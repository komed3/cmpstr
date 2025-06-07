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
 * Registry function to create a service for managing class constructors.
 * 
 * @param {RegistryConstructor<T>} ctor - The base constructor that all registered classes must extend
 * @returns {RegistryService<T>} - An object with methods to register, remove, check, get, and list classes
 */
export function Registry<T> ( ctor: RegistryConstructor<T> ) : RegistryService<T> {

    // Create a registry object to hold class constructors
    const registry: Record<string, RegistryConstructor<T>> = Object.create( null );

    return {

        /**
         * Register a new extension of the base class.
         * 
         * @param {string} name - The name of the class to register
         * @param {RegistryConstructor<T>} cls - The class constructor
         * @param {boolean} [update=false] - Whether to allow overwriting an existing entry
         * @throws {TypeError} If the class does not extend the base constructor
         * @throws {Error} If the class name already exists and update is false
         */
        add (
            name: string, cls: RegistryConstructor<T>,
            update: boolean = false
        ) : void {

            if ( ! ( cls.prototype instanceof ctor ) ) throw new TypeError (
                `class must extend <${ctor.name}>`
            );

            if ( ! update && name in registry ) throw new Error (
                `entry <${name}> already exists / use <update=true> to overwrite`
            );

            registry[ name ] = cls;

        },

        /**
         * Remove a class from the registry.
         * 
         * @param {string} name - The name of the class to remove
         */
        remove ( name: string ) : void { delete registry[ name ] },

        /**
         * Check if a class is registered.
         * 
         * @param {string} name - The name of the class to check
         * @returns {boolean} - True if the class is registered, false otherwise
         */
        has ( name: string ) : boolean { return name in registry },

        /**
         * List all registered class names.
         * 
         * @returns {string[]} - An array of registered class names
         */
        list () : string[] { return Object.keys( registry ) },

        /**
         * Get a registered class by name.
         * 
         * @param {string} name - The name of the class to retrieve
         * @returns {RegistryConstructor<T>} - The class constructor
         * @throws {Error} If the class is not registered
         */
        get ( name: string ) : RegistryConstructor<T> {

            if ( ! ( name in registry ) ) throw new Error (
                `class <${name}> not registered for <${ctor.name}>`
            );

            return registry[ name ];

        }

    };

}