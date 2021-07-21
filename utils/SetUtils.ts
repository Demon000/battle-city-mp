export class SetUtils {
    static union<T>(...sets: Set<T>[]): Set<T> {
        const result = new Set<T>();

        for (const set of sets) {
            for (const value of set) {
                result.add(value);
            }
        }

        return result;
    }

    static intersection<T>(...sets: Set<T>[]): Set<T> {
        const map = new Map<T, number>();
        const result = new Set<T>();

        for (const set of sets) {
            for (const value of set) {
                let noEntries = map.get(value) ?? 0;
                map.set(value, noEntries + 1);
            }
        }

        for (const entry of map.entries()) {
            if (entry[1] === sets.length) {
                result.add(entry[0]);
            }
        }

        return result;
    }
}
