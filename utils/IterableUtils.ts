export class IterableUtils {
    static has<
        T extends (string | number | symbol),
    >(
        iterable: Iterable<T>,
        value: T,
    ): boolean {
        for (const iterableValue of iterable) {
            if (iterableValue == value) {
                return true;
            }
        }

        return false;
    }

    static isEmpty<T>(iterable: Iterable<T>): boolean {
        for (const _ of iterable) {
            return false;
        }

        return true;
    }
}
