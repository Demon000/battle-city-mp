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

export class LazyIterableIterator<T> {
    private iterator;
    private operations;

    constructor(iterator: Iterator<any>, operations: IterableOperation[]) {
        this.iterator = iterator;
        this.operations = operations;
    }

    next(): IteratorResult<T> {
        let value;
        while ((value = this.iterator.next().value)) {
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

            return {
                value: result,
                done: false,
            };
        }

        return {
            value: undefined,
            done: true,
        };
    }
}

export class LazyIterable<T> implements Iterable<T> {
    private iterable;
    private operations;

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

    forEach<C>(
        fn: (value: T) => void,
        context?: C,
    ): void {
        const fnc = fn.bind(context);
        for (const value of this) {
            fnc(value);
        }
    }

    toArray(): T[] {
        return Array.from(this);
    }

    [Symbol.iterator](): Iterator<T, any, undefined> {
        const iterator = this.iterable[Symbol.iterator]();
        return new LazyIterableIterator(iterator, this.operations);
    }
}
