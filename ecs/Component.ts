import { nonenumerable } from '@/utils/enumerable';
import { Entity } from './Entity';
import { Registry } from './Registry';

export type ComponentInitialization =
    [ComponentClassType<any>, any] |
    ComponentClassType<any> |
    [string, any] |
    string;

export class Component<C extends Component<C>> {
    @nonenumerable
    readonly registry: Registry;

    @nonenumerable
    readonly entity: Entity;

    @nonenumerable
    readonly clazz: ComponentClassType<C>;

    @nonenumerable
    ignore = false;

    constructor(
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<C>,
    ) {
        this.registry = registry;
        this.entity = entity;
        this.clazz = clazz;
    }

    static networked?: boolean;

    static readonly TAG?: string;

    static get tag(): string {
        return this.TAG ?? this.name;
    }

    getData(): Partial<this> {
        return {...this};
    }

    setData(encoding: Record<string, any>): void {
        Object.assign(this, encoding);
    }

    update(data?: Record<string, any>): C {
        return this.entity.updateComponent(this.clazz, data);
    }

    remove(): C | undefined {
        return this.entity.removeComponent(this.clazz);
    }
}

export type ComponentClassType<C = any> = {
    readonly TAG?: string;
    readonly tag: string;
    readonly networked?: boolean;

    new (
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<C>,
    ): C;
};
