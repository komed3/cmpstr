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

import type { CmpStrErrorMeta } from './Types';

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

}
