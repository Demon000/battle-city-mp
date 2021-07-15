import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { Component, ComponentClassType } from './Component';
import { Entity } from './Entity';
import { EntityId } from './EntityId';
import { RegistryIdGenerator } from './RegistryIdGenerator';
import { RegistryViewIterator } from './RegistryViewIterator';

export type ComponentInitialization =
    [ComponentClassType<any>, any] |
    ComponentClassType<any>;

export enum RegistryEvent {
    ENTITY_ADDED = 'entity-added',
    ENTITY_REMOVED = 'entity-removed',

    COMPONENT_ADDED = 'component-added',
    COMPONENT_REMOVED = 'component-removed',
}

export interface RegistryEvents {
    [RegistryEvent.ENTITY_ADDED]: (entity: Entity) => void;
    [RegistryEvent.ENTITY_REMOVED]: (entity: Entity) => void;
}

export interface RegistryComponentEvents {
    [RegistryEvent.COMPONENT_ADDED]: <C extends Component<C>>(
        registry: Registry,
        component: C,
    ) => void;
    [RegistryEvent.COMPONENT_REMOVED]: <C extends Component<C>>(
        registry: Registry,
        component: C,
    ) => void;
}

export class Registry {
    private tagsComponentsMap = new Map<string, Set<Component<any>>>();
    private componentsEmitterMap = new Map<string, EventEmitter<RegistryComponentEvents>>();

    private idsEntityMap = new Map<EntityId, Entity>();
    emitter = new EventEmitter<RegistryEvents>();

    constructor(
        private idGenerator: RegistryIdGenerator,
    ) {}

    componentEmitter<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        create?: false,
    ): EventEmitter<RegistryComponentEvents> | undefined;
    componentEmitter<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        create: true,
    ): EventEmitter<RegistryComponentEvents>;
    componentEmitter<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        create?: boolean,
    ): EventEmitter<RegistryComponentEvents> | undefined {
        let componentEmitter = this.componentsEmitterMap.get(clazz.tag);
        if (componentEmitter === undefined && create) {
            componentEmitter = new EventEmitter<RegistryComponentEvents>();
            this.componentsEmitterMap.set(clazz.tag, componentEmitter);
        }

        return componentEmitter;
    }

    registerEntity(entity: Entity): void {
        assert(!this.idsEntityMap.has(entity.id));
        this.idsEntityMap.set(entity.id, entity);
    }

    generateId(): EntityId {
        return this.idGenerator.generate();
    }

    createEntity(components: ComponentInitialization[]): Entity {
        const id = this.generateId();
        const entity = new Entity(id, this);
        this.registerEntity(entity);

        if (components !== undefined) {
            this.addComponents(entity, components);
        }

        return entity;
    }

    addComponents(entity: Entity, components: ComponentInitialization[]): void {
        for (const clazzDataOrClazz of components) {
            let clazz;
            let data;

            if (Array.isArray(clazzDataOrClazz)) {
                [clazz, data] = clazzDataOrClazz;
            } else {
                clazz = clazzDataOrClazz;
            }

            this.addComponent(entity, clazz, data);
        }
    }

    destroyEntity(entity: Entity): void {
        entity.removeComponents();
        const entityIdExisted = this.idsEntityMap.delete(entity.id);
        assert(entityIdExisted);
    }

    private getOrCreateComponentTypeSet<C extends Component<C>>(
        clazz: ComponentClassType<C>,
    ): Set<Component<C>> {
        let tagComponents = this.tagsComponentsMap.get(clazz.tag);
        if (tagComponents === undefined) {
            tagComponents = new Set<Component<C>>();
            this.tagsComponentsMap.set(clazz.tag, tagComponents);
        }

        return tagComponents;
    }

    setComponentData<
        C extends Component<C>,
    >(
        component: C,
        data?: Partial<C>,
    ): void {
        Object.assign(component, data);
    }

    _addUpsertComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazz: ComponentClassType<C>,
        data?: Partial<C>,
        upsert = false,
    ): C {
        let component = entity.findComponent(clazz);
        const componentExisted = component !== undefined;
        if (component !== undefined && !upsert) {
            assert(false);
        }

        if (component === undefined) {
            component = new clazz(this, entity, clazz);
        }

        this.setComponentData(component, data);

        if (componentExisted) {
            return component;
        }

        entity.addLocalComponent(component);

        const tagComponents = this.getOrCreateComponentTypeSet(clazz);
        tagComponents.add(component);

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter) {
            componentEmitter.emit(RegistryEvent.COMPONENT_ADDED, this, component);
        }

        return component;
    }

    addComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazz: ComponentClassType<C>,
        data?: Partial<C>,
    ): C {
        return this._addUpsertComponent(entity, clazz, data, false);
    }

    upsertComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazz: ComponentClassType<C>,
        data?: Partial<C>,
    ): C {
        return this._addUpsertComponent(entity, clazz, data, true);
    }

    removeEntityComponent<C extends Component<C>>(
        entity: Entity,
        clazz: ComponentClassType<C>,
    ): C {
        const component = entity.removeLocalComponent(clazz);

        const tagComponents = this.tagsComponentsMap.get(clazz.tag);
        assert(tagComponents);

        const tagsHadComponent = tagComponents.delete(component);
        assert(tagsHadComponent);

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter) {
            componentEmitter.emit(RegistryEvent.COMPONENT_REMOVED, this, component);
        }

        return component;
    }

    removeComponent<C extends Component<C>>(
        component: C,
    ): C {
        return this.removeEntityComponent(component.entity, component.clazz) as C;
    }

    findEntityById(id: EntityId): Entity | undefined {
        return this.idsEntityMap.get(id);
    }

    getEntityById(id: EntityId): Entity {
        const entity = this.getEntityById(id);
        assert(entity);
        return entity;
    }

    getEntities(): IterableIterator<Entity> {
        return this.idsEntityMap.values();
    }

    getComponents<C extends Component<C>>(
        clazz: ComponentClassType<C>,
    ): IterableIterator<C> {
        return this.getOrCreateComponentTypeSet(clazz).keys() as IterableIterator<C>;
    }

    getView<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        ...clazzes: ComponentClassType[]
    ): Iterable<Entity> {
        return {
            [Symbol.iterator]: () => new RegistryViewIterator(
                this.getComponents(clazz),
                clazzes,
            ),
        };
    }
}
