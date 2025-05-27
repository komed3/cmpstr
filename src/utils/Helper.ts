'use strict';

export class Helper {

    /**
     * Returns a high-resolution timestamp.
     * Uses performance.now() if available, otherwise Date.now().
     * 
     * @returns {number} - High-resolution timestamp
     */
    public static now () : number {

        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now() : Date.now();

    }

};