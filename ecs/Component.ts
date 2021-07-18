import { Entity } from './Entity';
import { Registry } from './Registry';

export class Component<C extends Component<C>> {
    constructor(
        readonly registry: Registry,
        readonly entity: Entity,
        readonly clazz: ComponentClassType<C>,
    ) {}

    static readonly TAG?: string;

    static get tag(): string {
        return this.TAG ?? this.name;
    }

    getData(): Partial<this> {
        return {};
    }

    setData(encoding: Partial<this>): void {
        Object.assign(this, encoding);
    }

    remove(): C {
        return this.entity.removeComponent(this.clazz);
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
