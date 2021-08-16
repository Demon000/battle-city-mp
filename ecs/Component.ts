import { nonenumerable } from '@/utils/enumerable';
import { Entity } from './Entity';
import { Registry, RegistryOperationOptions } from './Registry';

export type ClazzOrTag<C = any> = ComponentClassType<C> | string;
export type ComponentsInitialization = Record<string, any>;

export enum ComponentFlags {
    LOCAL_ONLY = 1 << 0,
}

export class Component<C extends Component<C>> {
    @nonenumerable
    readonly registry: Registry;

    @nonenumerable
    readonly entity: Entity;

    @nonenumerable
    readonly clazz: ComponentClassType<C>;

    @nonenumerable
    flags = 0;

    constructor(
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<C>,
    ) {
        this.registry = registry;
        this.entity = entity;
        this.clazz = clazz;
    }

    static readonly TAG?: string;

    static get tag(): string {
        return this.TAG ?? this.name;
    }

    getData(): Partial<this> {
        return {...this};
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
    readonly tag: string;

    new (
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<C>,
    ): C;
};
