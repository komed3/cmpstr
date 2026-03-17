/**
 * CmpStr Options Validator
 * src/utils/OptionsValidator.ts
 * 
 * This module provides the OptionsValidator class, which contains static methods for validating
 * the options passed to the CmpStr function. It checks for correct types, allowed values, and
 * the existence of specified metrics and phonetic algorithms in their respective registries.
 * 
 * If any validation fails, a CmpStrValidationError is thrown with a descriptive message and
 * relevant details about the invalid option.
 * 
 * @module Utils
 * @name OptionsValidator
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import type { CmpStrOptions, CmpStrProcessors, MetricOptions, PhoneticOptions } from './Types';

import { CmpStrValidationError } from './Errors';
import { MetricRegistry } from '../metric';
import { PhoneticRegistry } from '../phonetic';


/**
 * Utility for validating CmpStr options.
 * 
 * This class provides static methods to validate various aspects of the
 * options object passed to CmpStr.
 */
export class OptionsValidator {

    /** Allowed normalization flags */
    private static readonly ALLOWED_FLAGS = new Set ( [ 'd', 'u', 'x', 'w', 't', 'r', 's', 'k', 'n', 'i' ] );
    /** Allowed output modes */
    private static readonly ALLOWED_OUTPUT = new Set ( [ 'orig', 'prep' ] );
    /** Allowed comparison modes */
    private static readonly ALLOWED_MODES = new Set ( [ 'default', 'batch', 'single', 'pairwise' ] );

    /** Processor dispatch table */
    private static readonly PROCESSORS = {
        phonetic: ( opt: CmpStrProcessors[ 'phonetic' ] ) => OptionsValidator.validatePhonetic( opt )
    } as const;

}
