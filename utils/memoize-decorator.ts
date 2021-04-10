type HashFn = (args: any[]) => string;
type HashFnParameter = boolean | HashFn;
type CalledFn = (this: any, ...args: any[]) => void;

export function Memoize(hashFn?: HashFnParameter): CalledFn {
    return (_target, _propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        if (descriptor.value != null) {
            descriptor.value = getNewFunction(descriptor.value, hashFn);
        } else if (descriptor.get != null) {
            descriptor.get = getNewFunction(descriptor.get, hashFn);
        } else {
            throw 'Only put a Memoize() decorator on a method or get accessor.';
        }
    };
}

let counter = 0;
function getNewFunction(
    calledFn: CalledFn,
    hashFn?: HashFnParameter,
) {
    const identifier = ++counter;
    const mapName = `__memoized_map_${identifier}`;

    let actualHashfn: HashFn;
    if (hashFn === true) {
        actualHashfn = (args: any[]) => args.join('!');
    } else if (hashFn) {
        actualHashfn = hashFn;
    } else if (!hashFn) {
        actualHashfn = (args: any[]) => args[0];
    }

    return function (this: any, ...args: any[]) {
        if (!Object.prototype.hasOwnProperty.call(this, mapName)) {
            Object.defineProperty(this, mapName, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: new Map<any, any>(),
            });
        }

        const map = this[mapName];
        const key = actualHashfn.call(this, args);

        if (map.has(key)) {
            return map.get(key);
        }

        const value = calledFn.apply(this, args);
        map.set(key, value);
        return value;
    };
}
