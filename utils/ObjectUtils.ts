export default class ObjectUtils {
    static keysAssign<T, K extends keyof T>(target: T, keys: K[], source: Partial<Pick<T, K>>): T {
        for (const key of keys) {
            if (source[key] === undefined) {
                continue;
            }

            target[key] = source[key]!;
        }

        return target;
    }
}
