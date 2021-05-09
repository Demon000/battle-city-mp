import Entity from './Entity';
import Registry from './Registry';

export interface ComponentOptions {}

export class Component {
    static readonly tag = 'component';
    private registry;
    private entity;

    constructor(
        registry: Registry,
        entity: Entity,
    ) {
        this.registry = registry;
        this.entity = entity;
    }

    findSibling<T extends Component>(
        clazz: ComponentClassType<T>,
    ): T | undefined {
        return this.registry.findSiblingComponent(this, clazz);
    }

    getSibling<T extends Component>(
        clazz: ComponentClassType<T>,
    ): T {
        return this.registry.getSiblingComponent(this, clazz);
    }

    getEntity(): Entity {
        return this.entity;
    }
}

export interface ComponentClassType<T extends Component = any> {
    readonly tag: string;
    readonly serializable?: boolean;

    new (registry: Registry, entity: Entity): T;
}
