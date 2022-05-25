export enum IterableOperationType {
    MAP,
    FILTER,
    FLATTEN,
}

export type IterableOperation = {
    type: IterableOperationType.MAP;
    fn: (value: any) => any;
} | {
    type: IterableOperationType.FILTER;
    fn: (value: any) => boolean;
} | {
    type: IterableOperationType.FLATTEN;
};

export class LazyIterableIterator<T> {
    private iterator;
    private currentIterator: Iterator<any>;
    private operations;
    private start;

    constructor(
        iterator: Iterator<any>,
        operations: IterableOperation[],
        start: number,
    ) {
        this.iterator = iterator;
        this.currentIterator = iterator;
        this.operations = operations;
        this.start = start;
    }

    next(): IteratorResult<T> {
        while (true) {
            const item = this.currentIterator.next();

            /*
             * Current inner iterator is done, switch to main one.
             */
            if (item.done && this.currentIterator !== this.iterator) {
                this.currentIterator = this.iterator;
                continue;
            }

            if (item.done || this.currentIterator !== this.iterator) {
                return item;
            }

            let result: any = item.value;
            let isFilteredOut = false;

            for (let i = this.start; i < this.operations.length; i++) {
                const operation = this.operations[i];

                if (operation.type === IterableOperationType.FILTER) {
                    isFilteredOut = !operation.fn(result);
                } else if (operation.type === IterableOperationType.MAP) {
                    result = operation.fn(result);
                } else if (operation.type === IterableOperationType.FLATTEN) {
                    /*
                     * Flatten can only be called if the source is an iterable,
                     * wrap it in a LazyIterable, and start its inner operations
                     * from the operation after the current flatten one.
                     * Force exit the operations loop.
                     */
                    result = LazyIterable.from(
                        result as Iterable<any>, this.operations, i + 1);
                    this.currentIterator = result[Symbol.iterator]();
                    isFilteredOut = true;
                }

                if (isFilteredOut) {
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
    }
}

export class LazyIterable<T, X = T extends Iterable<infer V> ? V : never> implements Iterable<T> {
    private iterable;
    private operations;
    private start;

    private constructor(
        iterable: Iterable<any>,
        operations: IterableOperation[] = [],
        start = 0,
    ) {
        this.iterable = iterable;
        this.operations = operations;
        this.start = start;
    }

    static from<B>(
        iterable: Iterable<B>,
        operations?: IterableOperation[],
        start?: number,
    ): LazyIterable<B> {
        if ((operations === undefined || operations.length === 0)
            && (start === undefined || start === 0)
            && iterable instanceof LazyIterable) {
            return iterable;
        }

        return new LazyIterable<B>(iterable, operations, start);
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

    flatten(): LazyIterable<X> {
        return new LazyIterable(this.iterable, [...this.operations, {
            type: IterableOperationType.FLATTEN,
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
        return new LazyIterableIterator(iterator, this.operations, this.start);
    }
}
