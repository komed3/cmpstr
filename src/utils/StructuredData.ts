import { MetricRaw } from './Types';

export class StructuredData<T = any, R = MetricRaw> {

    public static create<T = any, R = MetricRaw> (
        data: T[], key: string | number | symbol
    ) : StructuredData<T, R> {

        return new StructuredData ( data, key );

    }

    protected data: T[];
    protected key: string | number | symbol;

    protected constructor ( data: T[], key: string | number | symbol ) {

        this.data = data;
        this.key = key;

    }

    protected extract () : string[] {

        return this.data.map( item => String ( ( item as any )[ this.key ] ?? '' ) );

    }

}
