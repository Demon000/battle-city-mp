export class SetUtils {
    static union<T>(...iterables: Iterable<T>[]): Iterable<T> {
        const result = new Set<T>();

        for (const iterable of iterables) {
            for (const value of iterable) {
                result.add(value);
            }
        }

        return result;
    }

    static intersection<T>(...iterables: Iterable<T>[]): Iterable<T> {
        const map = new Map<T, number>();
        const result = new Set<T>();

        for (const iterable of iterables) {
            for (const value of iterable) {
                const noEntries = map.get(value) ?? 0;
                map.set(value, noEntries + 1);
            }
        }

        for (const entry of map.entries()) {
            if (entry[1] === iterables.length) {
                result.add(entry[0]);
            }
        }

        return result;
    }
}
