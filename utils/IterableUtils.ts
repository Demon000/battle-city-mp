export default class IterableWrapper<T> {
    iterable: Iterable<T>;

    constructor(iterable: Iterable<T>) {
        this.iterable = iterable;
    }

    static *mapGenerator<T, R, C>(
        iterable: Iterable<T>,
        fn: (value: T) => R,
        context?: C,
    ): Generator<R, void, void> {
        const fnc = context ? fn.bind(context) : fn;
        for (const value of iterable) {
            yield fnc(value);
        }
    }

    map<R, C>(
        fn: (value: T) => R,
        context?: C,
    ): IterableWrapper<R> {
        const generator = IterableWrapper.mapGenerator(this.iterable, fn, context);
        return new IterableWrapper(generator);
    }

    static *filterGenerator<T, C>(
        iterable: Iterable<T>,
        fn: (value: T) => boolean,
        context?: C,
    ): Generator<T, void, void> {
        const fnc = context ? fn.bind(context) : fn;
        for (const value of iterable) {
            if (fnc(value)) {
                yield value;
            }
        }
    }

    filter<C>(
        fn: (value: T) => boolean,
        context?: C,
    ): IterableWrapper<T> {
        const generator = IterableWrapper.filterGenerator(this.iterable, fn, context);
        return new IterableWrapper(generator);
    }

    forEach<C>(
        fn: (value: T) => void,
        context?: C,
    ): void {
        const fnc = context ? fn.bind(context) : fn;
        for (const value of this.iterable) {
            fnc(value);
        }
    }
}
