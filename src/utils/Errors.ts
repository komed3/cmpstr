/**
 * Error Utilities
 * src/utils/Errors.ts
 * 
 * This module provides a small hierarchy of error classes and helper methods
 * that standardize error creation and formatting across the CmpStr project.
 * It improves on vanilla JavaScript errors by adding codes, structured metadata,
 * and consistent `toString()` / `toJSON()` output while keeping the original
 * message text intact.
 * 
 * The error classes are designed to be lightweight and fast, while still
 * providing useful context for debugging (including optional `cause` chaining).
 * 
 * @module Utils
 * @name Errors
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { CmpStrErrorJSON, CmpStrErrorMeta } from './Types';


/**
 * Base error class for CmpStr.
 * 
 * It provides a standard `code` field and a consistent `toString()` / `toJSON()`
 * output without changing the original error message expectations.
 */
export class CmpStrError extends Error {

    /** A short, machine-readable error code */
    public readonly code: string;

    /** Optional structured metadata for the error */
    public readonly meta?: CmpStrErrorMeta;

    /** Timestamp when the error was created (ISO 8601) */
    public readonly when: string = new Date().toISOString();

    /**
     * Constructor for CmpStrError.
     * 
     * Will construct an error with a code, message, optional metadata, and optional cause.
     * 
     * @param {string} code - A short, machine-readable error code
     * @param {string} message - The error message (human-readable)
     * @param {CmpStrErrorMeta} [meta] - Optional structured metadata for the error
     * @param {unknown} [cause] - Optional cause (native JS Error chaining)
     */
    constructor ( code: string, message: string, meta?: CmpStrErrorMeta, cause?: unknown ) {
        super ( message, cause !== undefined ? { cause } : undefined );

        this.name = this.constructor.name;
        this.code = code;
        this.meta = meta;

        // Preserve stack trace (modern environments already set this)
        if ( typeof Error.captureStackTrace === 'function' ) {
            Error.captureStackTrace( this, this.constructor );
        }
    }

    /**
     * Serialize the error into a plain object for JSON output.
     */
    public toJSON () : CmpStrErrorJSON {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            meta: this.meta,
            when: this.when,
            cause: this.cause instanceof Error ? {
                name: this.cause.name,
                message: this.cause.message,
                stack: ( this.cause as any ).stack
            } : this.cause
        };
    }

    /**
     * Pretty string representation of the error.
     * 
     * @param {boolean} [stack=false] - Whether to include the stack trace in the output
     */
    public override toString ( stack: boolean = false ) : string {
        const parts: string[] = [ `${this.name} [${this.code}]`, this.message ];

        if ( this.meta && Object.keys( this.meta ).length ) {
            try { parts.push( JSON.stringify( this.meta ) ) }
            catch { /* ignore */ }
        }

        return parts.join( ' - ' ) + (
            stack && this.stack ? `\nStack Trace:\n${this.stack}` : ''
        );
    }

}

/**
 * Error thrown when user input (options, arguments) is invalid.
 */
export class CmpStrValidationError extends CmpStrError {
    constructor ( message: string, meta?: CmpStrErrorMeta, cause?: unknown ) {
        super ( 'E_VALIDATION', message, meta, cause );
    }
}

/**
 * Error thrown when a requested resource is missing or not found.
 */
export class CmpStrNotFoundError extends CmpStrError {
    constructor ( message: string, meta?: CmpStrErrorMeta, cause?: unknown ) {
        super ( 'E_NOT_FOUND', message, meta, cause );
    }
}

/**
 * Error thrown for incorrect usage or invalid state (assertions).
 */
export class CmpStrUsageError extends CmpStrError {
    constructor ( message: string, meta?: CmpStrErrorMeta, cause?: unknown ) {
        super ( 'E_USAGE', message, meta, cause );
    }
}

/**
 * Error thrown for internal failures that should not happen under normal usage.
 */
export class CmpStrInternalError extends CmpStrError {
    constructor ( message: string, meta?: CmpStrErrorMeta, cause?: unknown ) {
        super ( 'E_INTERNAL', message, meta, cause );
    }
}

/**
 * Helper utilities for throwing and formatting errors.
 * 
 * Provides methods for asserting conditions, wrapping unknown errors, and formatting
 * errors into readable strings. This centralizes error handling logic and ensures
 * consistent error messages across the codebase.
 */
export class ErrorUtil {

    /**
     * Throw a `CmpStrUsageError` if a condition is not met.
     * 
     * @param {boolean} condition - The condition to assert
     * @param {string} message - The error message to throw if the condition is false
     * @param {CmpStrErrorMeta} [meta] - Optional structured metadata for the error
     * @throws {CmpStrUsageError} - If the condition is false
     */
    public static assert ( condition: boolean, message: string, meta?: CmpStrErrorMeta ) : asserts condition {
        if ( ! condition ) throw new CmpStrUsageError ( message, meta );
    }

    /**
     * Wrap an unknown error into a `CmpStrInternalError`.
     * 
     * @param {unknown} err - The error to wrap
     * @param {string} message - The error message to use for the wrapped error
     * @param {CmpStrErrorMeta} [meta] - Optional structured metadata for the error
     * @throws {CmpStrInternalError} - Always throws a new `CmpStrInternalError` wrapping the original error
     */
    public static rethrow ( err: unknown, message: string, meta?: CmpStrErrorMeta ) : never {
        if ( err instanceof CmpStrError ) throw err;
        throw new CmpStrInternalError ( message, meta, err );
    }

    /**
     * Format any error into a readable string.
     * 
     * @param {unknown} err - The error to format
     * @returns {string} - A formatted string representation of the error
     */
    public static format ( err: unknown ) : string {
        if ( err instanceof CmpStrError ) return err.toString();
        if ( err instanceof Error ) return `${err.name}: ${err.message}`;
        return String( err );
    }

    /**
     * Execute a synchronous operation and wrap any exception as a `CmpStrInternalError`.
     * 
     * This is used to avoid repeating try/catch blocks and to add consistent context
     * to unexpected failures while preserving the original error as `cause`.
     * 
     * @param {() => T} fn - The function to execute
     * @param {string} message - The error message to use if an exception is thrown
     * @param {CmpStrErrorMeta} [meta] - Optional structured metadata for the error
     * @return {T} The result of the function if it executes successfully
     * @throws {CmpStrInternalError} - If the function throws an error, it will be wrapped and re-thrown as a `CmpStrInternalError`
     */
    public static wrap< T > ( fn: () => T, message: string, meta?: CmpStrErrorMeta ) : T {
        try { return fn() } catch ( err ) {
            if ( err instanceof CmpStrError ) throw err;
            throw new CmpStrInternalError( message, meta, err );
        }
    }

    /**
     * Execute an asynchronous operation and wrap any exception as a `CmpStrInternalError`.
     * 
     * @param {() => Promise< T >} fn - The asynchronous function to execute
     * @param {string} message - The error message to use if an exception is thrown
     * @param {CmpStrErrorMeta} [meta] - Optional structured metadata for the error
     * @return {Promise< T >} A promise that resolves to the result of the function if it executes successfully
     * @throws {CmpStrInternalError} - If the function throws an error, it will be wrapped and re-thrown as a `CmpStrInternalError`
     */
    public static async wrapAsync< T > ( fn: () => Promise< T >, message: string, meta?: CmpStrErrorMeta ) : Promise< T > {
        try { return await fn() } catch ( err ) {
            if ( err instanceof CmpStrError ) throw err;
            throw new CmpStrInternalError( message, meta, err );
        }
    }

}
