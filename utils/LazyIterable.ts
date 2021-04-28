export enum IterableOperationType {
    MAP,
    FILTER,
}

export type IterableOperation = {
    type: IterableOperationType.MAP;
    fn: (value: any) => any;
} | {
    type: IterableOperationType.FILTER;
    fn: (value: any) => boolean;
};

export default class LazyIterable<T> implements Iterable<T> {
    private _values?: Array<T>;
    private iterable: Iterable<any>;
    private operations: IterableOperation[];

    private constructor(iterable: Iterable<any>, operations: IterableOperation[] = []) {
        this.iterable = iterable;
        this.operations = operations;
    }

    static from<B>(iterable: Iterable<B>): LazyIterable<B> {
        if (iterable instanceof LazyIterable) {
            return iterable;
        }

        return new LazyIterable<B>(iterable);
    }

    map<R, C>(
        fn: (value: T) => R,
        context?: C,
    ): LazyIterable<R> {
        return new LazyIterable(this.iterable, [...this.operations, {
            type: IterableOperationType.MAP,
            fn: fn.bind(context),
        }]);
    }

    filter<C>(
        fn: (value: T) => boolean,
        context?: C,
    ): LazyIterable<T> {
        return new LazyIterable(this.iterable, [...this.operations, {
            type: IterableOperationType.FILTER,
            fn: fn.bind(context),
        }]);
    }

    values(): Array<T> {
        if (this._values !== undefined) {
            return this._values;
        }

        const values = new Array<T>();

        for (const value of this.iterable) {
            let isFilteredOut = false;
            let result: any = value;
            for (const operation of this.operations) {
                if (operation.type === IterableOperationType.FILTER) {
                    isFilteredOut = !operation.fn(result);
                } else if (operation.type === IterableOperationType.MAP) {
                    result = operation.fn(result);
                }

                if (isFilteredOut === true) {
                    break;
                }
            }

            if (isFilteredOut) {
                continue;
            }

            values.push(result);
        }

        return this._values = values;
    }

    forEach<C>(
        fn: (value: T) => void,
        context?: C,
    ): void {
        const values = this.values();
        const fnc = fn.bind(context);
        for (const value of values) {
            fnc(value);
        }
    }

    [Symbol.iterator](): Iterator<T, any, undefined> {
        const values = this.values();
        let index = 0;

        return {
            next(): IteratorResult<T> {
                if (index >= values.length) {
                    return {
                        done: true,
                        value: null,
                    };
                }

                return {
                    done: false,
                    value: values[index++],
                };
            },
        };
    }
}
