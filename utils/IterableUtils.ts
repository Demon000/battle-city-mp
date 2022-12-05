export class IterableUtils {
    static equals<T>(first: Iterable<T>, second: Iterable<T>): boolean {
        if (first === second) {
            return true;
        }

        for (const value of first) {
            if (!(value in second)) {
                return false;
            }
        }

        for (const value of second) {
            if (!(value in first)) {
                return false;
            }
        }

        return true;
    }

    static isEmpty<T>(iterable: Iterable<T>): boolean {
        for (const _ of iterable) {
            return false;
        }

        return true;
    }
}
