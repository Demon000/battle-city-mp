export class ArrayUtils {
    static from<T>(value: Iterable<T>): T[] {
        if (value instanceof Array) {
            console.log('hit');
            return value as T[];
        }

        const result = Array.from(value);
        console.log('not hit', result.length);
        return result;
    }
}
