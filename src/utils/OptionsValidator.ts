/**
 * CmpStr Options Validator
 * src/utils/OptionsValidator.ts
 * 
 * This module provides a lightweight, high-performance validator for user supplied
 * CmpStr options. It only performs a small number of checks and delegates to the
 * existing registries for metric and phonetic validation.
 * 
 * The goal is to fail fast on obvious invalid input while avoiding any heavy
 * computation or allocations that could cause "overheat".
 * 
 * @module Utils
 * @name OptionsValidator
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

/**
 * Utility for validating CmpStr options.
 * 
 * The validator is designed to be lightweight and safe to call frequently.
 */
export class OptionsValidator {

    // Allowed normalization flags
    private static readonly ALLOWED_FLAGS = new Set( [ 'd', 'u', 'x', 'w', 't', 'r', 's', 'k', 'n', 'i' ] );

    // Allowed output modes
    private static readonly ALLOWED_OUTPUT = new Set( [ 'orig', 'prep' ] );

}
