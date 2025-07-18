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
 *    - Output files: dist/CmpStr.umd.js (unminified), dist/CmpStr.umd.min.js (minified)
 *    - Format: UMD (Universal Module Definition)
 *    - Exposes the library as a global variable 'CmpStr' for direct use in browsers
 *    - Includes both a readable and a minified version (using Terser)
 * 
 * 4. Browser Build (EMS):
 *   - Output files: dist/CmpStr.esm.js (unminified), dist/CmpStr.esm.min.js (minified)
 *   - Format: ES module (import/export syntax)
 *   - Suitable for modern browsers that support ES modules
 * 
 * Plugins:
 * --------
 * - @rollup/plugin-typescript: Compiles TypeScript sources
 * - @rollup/plugin-node-resolve: Resolves Node.js modules for browser compatibility
 * - @rollup/plugin-commonjs: Converts CommonJS modules to ES6 for Rollup consumption
 * - terser: Minifies the browser bundle for production use
 * - prettier: Formats the output files for better readability
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
import terser from '@rollup/plugin-terser';
import prettier from 'rollup-plugin-prettier';

import { execSync } from 'child_process';
import fs from 'fs';

const version = JSON.parse( fs.readFileSync( './package.json' ) ).version;
const commit = execSync( 'git rev-parse --short HEAD' ).toString().trim();
const date = new Date().toISOString().replace( /([^0-9])/g, '' ).substring( 2, 8 );
const build = `CmpStr v${version} build-${commit}-${ date }`;

const banner = `// ${build} by Paul Köhler @komed3 / MIT License`;

const preamble = `/**
 * ${build}
 * This is a lightweight, fast and well performing library for calculating string similarity.
 * (c) 2023-${ new Date().getFullYear() } Paul Köhler @komed3 / MIT License
 * Visit https://github.com/komed3/cmpstr and https://npmjs.org/package/cmpstr
 */`;

const plugins = [
    nodeResolve(), commonjs(),
    typescript( {
        tsconfig: './tsconfig.json',
        declaration: false
    } )
];

const beautify = prettier( {
    parser: 'babel',
    tabWidth: 2,
    bracketSpacing: true,
    bracketSameLine: true,
    singleQuote: true,
    jsxSingleQuote: true,
    trailingComma: 'none',
    objectWrap: 'collapse'
} );

const minify = terser( {
    format: { comments: false, preamble },
    compress: { passes: 6 }
} );

console.log( `-`.repeat( 80 ) );
console.log( `\x1b[36m[BUILD] \x1b[33m${build}\x1b[0m` );
console.log( `-`.repeat( 80 ) );

export default [

    // ESM Build
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist/esm',
            format: 'esm',
            entryFileNames: '[name].js',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
            banner
        },
        plugins: [ ...plugins, beautify ]
    },

    // CJS Build
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            entryFileNames: '[name].cjs',
            exports: 'auto',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
            banner
        },
        plugins: [ ...plugins, beautify ]
    },

    // Browser Build (UMD)
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/CmpStr.umd.js',
            format: 'umd',
            name: 'CmpStr',
            sourcemap: true,
            banner: preamble
        },
        plugins
    },

    // Minified Browser Build (UMD)
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/CmpStr.umd.min.js',
            format: 'umd',
            name: 'CmpStr',
            plugins: [ minify ],
            sourcemap: true
        },
        plugins
    },

    // Browser Build (EMS)
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/CmpStr.esm.js',
            format: 'es',
            sourcemap: true,
            banner: preamble
        },
        plugins
    },

    // Minified Browser Build (EMS)
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/CmpStr.esm.min.js',
            format: 'esm',
            plugins: [ minify ],
            sourcemap: true
        },
        plugins
    }

];
