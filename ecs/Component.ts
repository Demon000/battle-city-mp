import { assert } from '@/utils/assert';
import { nonenumerable } from '@/utils/enumerable';
import { Entity } from './Entity';
import { Registry, RegistryOperationOptions } from './Registry';

export type ClazzOrTag<C extends Component> = ComponentClassType<C> | string;
export type ComponentValidator<C> = (data: unknown) => C;
export type ComponentsInitialization = Record<string, any>;

export enum ComponentFlags {
    LOCAL_ONLY = 1 << 0,
    SHARED_BY_TYPE = 1 << 1,
    SHARED = 1 << 2,
}

export class Component {
    @nonenumerable
    readonly registry: Registry;

    @nonenumerable
    readonly entities: Set<Entity> = new Set();

    @nonenumerable
    readonly clazz: ComponentClassType<this>;

    @nonenumerable
    flags = 0;

    constructor(
        registry: Registry,
    ) {
        this.registry = registry;
        this.clazz = this.constructor as ComponentClassType<this>;
        this.flags = this.clazz.BASE_FLAGS;
    }

    @nonenumerable
    static readonly BASE_FLAGS: number = 0;

    @nonenumerable
    static readonly TAG?: string;

    get entity(): Entity {
        if (this.entities.size !== 1) {
            let status;
            if (this.detached) {
                status = 'detached';
            } else if (this.entities.size !== 1) {
                status = 'shared';
            }

            assert(false,
                `Cannot access entity of ${status} component`, this.clazz);
        }

        return this.entities.values().next().value!;
    }

    get detached(): boolean {
        return this.entities.size === 0;
    }

    static get tag(): string {
        return this.TAG ?? this.name;
    }

    getData(): Partial<this> {
        return {...this};
    }

    setData(encoding: any): void {
        Object.assign(this, encoding);
    }

    update(data?: any, options?: RegistryOperationOptions): this {
        return this.entity.updateComponent(this.clazz, data, options);
    }

    remove(options?: RegistryOperationOptions): this | undefined {
        return this.entity.removeComponent(this.clazz, options);
    }
}

export type ComponentClassType<C extends Component> = {
    readonly TAG?: string;
    readonly BASE_FLAGS: number;
    readonly tag: string;

    new (
        registry: Registry,
    ): C;
};
