export function assert(value: boolean, message?: string, ...args: unknown[]): asserts value {
    if (!value) {
        console.log(...args);
        throw new Error(message);
    }
}
