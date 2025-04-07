export interface Config {
    flags?: string;
    threshold?: number;
    options?: Record<string, any>;
}

export interface BatchResult {
    target: string;
    match: number | any;
}

export declare class CmpStr {

    constructor ( algo?: string, str?: string );

    isReady () : boolean;

    setStr ( str: string ) : boolean;

    getStr () : string;

    listAlgo ( loadedOnly?: boolean ) : string[];

    isAlgo ( algo: string ) : boolean;

    setAlgo ( algo: string ) : boolean;

    getAlgo () : string;

    addAlgo ( algo: string, callback: (
        a: string, b: string, ...args : any
    ) => number | any, useIt?: boolean ) : boolean;

    rmvAlgo( algo: string ) : boolean;

    listFilter () : string[];

    addFilter ( name: string, callback: (
        str: string
    ) => string, priority?: number ) : boolean;

    rmvFilter ( name: string ) : boolean;

    pauseFilter ( name: string ) : boolean;

    resumeFilter ( name: string ) : boolean;

    clearFilter () : boolean;

    setFlags( flags: string ) : void;

    getFlags () : string;

    normalize ( input: string|string[], flags?: string ) : string|string[];

    clearCache () : boolean;

    compare ( algo: string, a: string, b: string, config?: Config ) : number | any;

    test ( str: string, config?: Config ) : number | any;

    batchTest ( arr: string[], config?: Config ) : BatchResult[];

    match ( arr: string[], config?: Config ) : BatchResult[];

    closest ( arr: string[], config?: Config ) : string | undefined;

    similarityMatrix ( algo: string, arr: string[], config?: Config ) : number[][];

}