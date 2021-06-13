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

    remove(): C {
        return this.entity.removeComponent(this.clazz);
    }
}

export type ComponentClassType<C = any> = {
    readonly TAG?: string;
    readonly serializable?: boolean;
    readonly tag: string;
    readonly id?: number;

    new (
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<C>,
    ): C;
};
