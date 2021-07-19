export const enumerable = <T>(target: T, key: keyof T): void => {
    Object.defineProperty(target, key,  {
        set(value) {
            Object.defineProperty(this, key, {
                value,
                enumerable: true,
                writable: true,
                configurable: true,
            });
        },
        enumerable: true,
        configurable: true,
    });
};

export const nonenumerable = <T>(target: T, key: keyof T): void => {
    Object.defineProperty(target, key,  {
        set(value) {
            Object.defineProperty(this, key, {
                value,
                writable: true,
                configurable: true,
            });
        },
        configurable: true,
    });
};

