/**
 * Vitest Configuration for CmpStr
 * vitest.config.ts
 *
 * This configuration file sets up Vitest for testing the CmpStr library.
 * 
 * While running on GitHub Actions, it uses the `tap-flat` reporter for compact output and
 * the `github-actions` reporter for integration with GitHub's test reporting features.
 * 
 * In local development, it defaults to the `verbose` reporter, which provides detailed
 * output of test results.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import { defineConfig } from 'vitest/config';

export default defineConfig( {
    test: {
        reporters: process.env.GITHUB_ACTIONS
            ? [ 'tap-flat', 'github-actions' ]
            : [ 'verbose' ]
    }
} );
