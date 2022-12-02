export const nonenumerable = <T>(target: T, key: any): void => {
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

