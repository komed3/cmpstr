import { MetricRaw } from './Types';

export class StructuredData<T = any, R = MetricRaw> {

    public static create<T = any, R = MetricRaw> (
        data: T[], key: string | number | symbol
    ) : StructuredData<T, R> {

        return new StructuredData ( data, key );

    }

}
