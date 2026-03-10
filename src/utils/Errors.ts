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

    /** Optional cause (native JS Error chaining) */
    public readonly cause?: unknown;

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
        super( message );

        this.name = this.constructor.name;
        this.code = code;
        this.meta = meta;
        this.cause = cause;

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

}
