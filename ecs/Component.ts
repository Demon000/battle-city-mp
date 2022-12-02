import { assert } from '@/utils/assert';
import { Entity } from './Entity';
import { Registry, RegistryOperationOptions } from './Registry';

export type ClazzOrTag<C = any> = ComponentClassType<C> | string;
export type ComponentsInitialization = Record<string, any>;

export enum ComponentFlags {
    LOCAL_ONLY = 1 << 0,
    SHARED_BY_TYPE = 1 << 1,
    SHARED = 1 << 2,
}

const ComponentNonEnumerableKeys: Set<string> = new Set([
    'registry',
    'entities',
    'clazz',
    'flags',
    'TAG',
]);

export class Component<C extends Component<C>> {
    readonly registry: Registry;

    readonly entities: Set<Entity> = new Set();

    readonly clazz: ComponentClassType<C>;

    flags = 0;

    constructor(
        registry: Registry,
        clazz: ComponentClassType<C>,
    ) {
        this.registry = registry;
        this.clazz = clazz;
        this.flags = (this.constructor as ComponentClassType<any>).BASE_FLAGS;
    }

    static readonly BASE_FLAGS: number = 0;

    static readonly TAG?: string;

    get entity(): Entity {
        assert(this.entities.size === 1,
            'Cannot access entity of component attached to multiple',
            this.clazz);

        return this.firstEntity!;
    }

    get firstEntity(): Entity | undefined {
        return this.entities.values().next().value;
    }

    static get tag(): string {
        return this.TAG ?? this.name;
    }

    attachToEntity(entity: Entity): void {
        this.entities.add(entity);
    }

    detachFromEntity(entity: Entity): void {
        this.entities.delete(entity);
    }

    protected getNonEnumerableKeys(): Set<string> {
        return ComponentNonEnumerableKeys;
    }

    getData(): Record<string, any> {
        const nonEnumerableKeys = this.getNonEnumerableKeys();
        const data: Record<string, any> = {};

        for (const key of Object.keys(this)) {
            if (nonEnumerableKeys.has(key))
                continue;

            data[key] = this[key as keyof this];
        }

        return data;
    }

    setData(encoding: any): void {
        Object.assign(this, encoding);
    }

    update(data?: any, options?: RegistryOperationOptions): C {
        return this.entity.updateComponent(this.clazz, data, options);
    }

    remove(options?: RegistryOperationOptions): C | undefined {
        return this.entity.removeComponent(this.clazz, options);
    }
}

export type ComponentClassType<C = any> = {
    readonly TAG?: string;
    readonly BASE_FLAGS: number;
    readonly tag: string;

    new (
        registry: Registry,
        clazz: ComponentClassType<C>,
    ): C;
};
