import { assert } from './assert';
import { SetUtils } from './SetUtils';

export enum QueryObjectOperationType {
    OR,
    AND,
}

export type QueryObjectOptions<T> = {
    operation: QueryObjectOperationType,
    data: QueryObjectOptions<T>[],
} | (() => Iterable<T>) | Iterable<T>;

export class QueryObject {
    static eval<T>(options: QueryObjectOptions<T>): Iterable<T> {
        if (typeof options === 'function') {
            return options();
        } else if (!('operation' in options)) {
            return options;
        }

        const sets = [];
        for (const option of options.data) {
            sets.push(this.eval(option));
        }

        if (options.operation === QueryObjectOperationType.OR) {
            return SetUtils.union(...sets);
        } else if (options.operation === QueryObjectOperationType.AND) {
            return SetUtils.intersection(...sets);
        }

        assert(false);
    }
}
