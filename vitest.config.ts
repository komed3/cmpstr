import { defineConfig } from 'vitest/config';

export default defineConfig( {
    test: {
        reporters: process.env.GITHUB_ACTIONS
            ? [ 'tap-flat', 'github-actions' ]
            : [ 'verbose' ]
    }
} );