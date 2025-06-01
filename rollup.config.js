/**
 * Rollup Configuration for CmpStr
 * rollup.config.js
 * 
 * This configuration file defines the build process for the CmpStr library using Rollup.
 * It generates three different module formats to support a wide range of environments:
 * - ECMAScript Modules (ESM) for modern JavaScript bundlers and environments
 * - CommonJS (CJS) for Node.js and legacy module systems
 * - UMD (Universal Module Definition) for browser usage, including a minified version
 * 
 * The configuration uses TypeScript for source code, resolves Node modules, and supports
 * CommonJS dependencies. For the browser build, Terser is used to produce a minified
 * bundle.
 * 
 * Module Descriptions:
 * --------------------
 * 1. ESM Build:
 *    - Output directory: dist/esm
 *    - Format: ES module (import/export syntax)
 *    - Suitable for modern bundlers (Webpack, Rollup, Vite, etc.)
 * 
 * 2. CJS Build:
 *    - Output directory: dist/cjs
 *    - Format: CommonJS (require/module.exports syntax)
 *    - Suitable for Node.js and legacy environments
 * 
 * 3. Browser Build (UMD):
 *    - Output files: dist/browser/CmpStr.js (unminified), dist/browser/CmpStr.min.js
 *    - Format: UMD (Universal Module Definition)
 *    - Exposes the library as a global variable 'CmpStr' for direct use in browsers
 *    - Includes both a readable and a minified version (using Terser)
 * 
 * Plugins:
 * --------
 * - @rollup/plugin-typescript: Compiles TypeScript sources
 * - @rollup/plugin-node-resolve: Resolves Node.js modules for browser compatibility
 * - @rollup/plugin-commonjs: Converts CommonJS modules to ES6 for Rollup consumption
 * - terser: Minifies the browser bundle for production use
 * 
 * Usage:
 * ------
 * Run `rollup -c` to build all targets. The resulting files can be found in the
 * respective output directories for each module format.
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { minify } from 'terser';

const plugins = [
    nodeResolve(),
    commonjs(),
    typescript( {
        tsconfig: './tsconfig.json',
        declaration: false
    } )
];

export default [

    // ESM Build
    {
        input: 'src/CmpStr.ts',
        output: {
            dir: 'dist/esm',
            format: 'esm',
            entryFileNames: '[name].js',
            sourcemap: true
        },
        plugins
    },

    // CJS Build
    {
        input: 'src/CmpStr.ts',
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            entryFileNames: '[name].js',
            exports: 'auto',
            sourcemap: true
        },
        plugins
    },

    // Browser Build (UMD)
    {
        input: 'src/CmpStr.ts',
        output: [ {
            file: 'dist/browser/CmpStr.js',
            format: 'umd',
            name: 'CmpStr',
            sourcemap: true
        }, {
            file: 'dist/browser/CmpStr.min.js',
            format: 'umd',
            name: 'CmpStr',
            plugins: [ minify ],
            sourcemap: true
        } ],
        plugins
    }

];