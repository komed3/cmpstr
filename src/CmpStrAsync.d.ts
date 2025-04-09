import { CmpStr, Config, BatchResult } from './CmpStr';

export declare class CmpStrAsync extends CmpStr {

    normalizeAsync ( input: string|string[], flags?: string ) : Promise<string|string[]>;

    compareAsync ( algo: string, a: string, b: string, config?: Config ) : Promise<number | any>;

    testAsync ( str: string, config?: Config ) : Promise<number | any>;

    batchTestAsync ( arr: string[], config?: Config ) : Promise<BatchResult[]>;

    matchAsync ( arr: string[], config?: Config ) : Promise<BatchResult[]>;

    closestAsync ( arr: string[], config?: Config ) : Promise<string | undefined>;

    similarityMatrixAsync ( algo: string, arr: string[], config?: Config ) : Promise<number[][]>;

}
