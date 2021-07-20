import { ComponentRegistry } from './ComponentRegistry';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { Component, ComponentClassType, ComponentInitialization } from './Component';
import { Entity } from './Entity';
import { EntityId } from './EntityId';
import { RegistryIdGenerator } from './RegistryIdGenerator';
import { RegistryViewIterator } from './RegistryViewIterator';

export enum RegistryEvent {
    ENTITY_REGISTERED = 'entity-registered',
    ENTITY_BEFORE_DESTROY = 'entity-before-destroy',

    COMPONENT_ADDED = 'component-added',
    COMPONENT_UPDATED = 'component-updated',
    COMPONENT_BEFORE_REMOVE = 'component-before-remove',
    COMPONENT_REMOVED = 'component-removed',
}

export interface RegistryEvents {
    [RegistryEvent.ENTITY_REGISTERED]: (entity: Entity) => void;
    [RegistryEvent.ENTITY_BEFORE_DESTROY]: (entity: Entity) => void;
    [RegistryEvent.COMPONENT_ADDED]: <C extends Component<C>>(
        component: C,
    ) => void;
    [RegistryEvent.COMPONENT_UPDATED]: <C extends Component<C>>(
        component: C,
    ) => void;
    [RegistryEvent.COMPONENT_BEFORE_REMOVE]: <C extends Component<C>>(
        component: C,
    ) => void;
}

export interface RegistryComponentEvents {
    [RegistryEvent.COMPONENT_ADDED]: <C extends Component<C>>(
        component: C,
    ) => void;
    [RegistryEvent.COMPONENT_UPDATED]: <C extends Component<C>>(
        component: C,
    ) => void;
    [RegistryEvent.COMPONENT_BEFORE_REMOVE]: <C extends Component<C>>(
        component: C,
    ) => void;
}

export type DataHandlingFn = <C extends Component<C>>(
    entity: Entity,
    clazzOrTag: ComponentClassType<C> | string,
    data?: Record<string, any>,
) => C;

export class Registry {
    private tagsComponentsMap = new Map<string, Set<Component<any>>>();
    private componentsEmitterMap = new Map<string, EventEmitter<RegistryComponentEvents>>();

    private idsEntityMap = new Map<EntityId, Entity>();
    emitter = new EventEmitter<RegistryEvents>();

    constructor(
        private idGenerator: RegistryIdGenerator,
        private componentRegistry: ComponentRegistry,
    ) {
        this.addComponent = this.addComponent.bind(this);
        this.updateComponent = this.updateComponent.bind(this);
        this.upsertComponent = this.upsertComponent.bind(this);
    }

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

        this.emitter.emit(RegistryEvent.ENTITY_REGISTERED, entity);
    }

    generateId(): EntityId {
        return this.idGenerator.generate();
    }

    createEntity(components?: ComponentInitialization[]): Entity {
        const id = this.generateId();
        const entity = new Entity(id, this);
        this.registerEntity(entity);

        if (components !== undefined) {
            this.addComponents(entity, components);
        }

        return entity;
    }

    destroyEntity(entity: Entity): void {
        entity.removeComponents();
        const entityIdExists = this.idsEntityMap.has(entity.id);
        assert(entityIdExists);

        this.emitter.emit(RegistryEvent.ENTITY_BEFORE_DESTROY, entity);

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

    private getClazz<
        C extends Component<C>,
    >(clazzOrTag: ComponentClassType<C> | string): ComponentClassType<C> {
        let clazz;
        if (typeof clazzOrTag === 'string') {
            clazz = this.componentRegistry.getComponentClassByTag(clazzOrTag);
        } else {
            clazz = clazzOrTag;
        }

        return clazz;
    }

    runForComponentInitialization(
        entity: Entity,
        components: ComponentInitialization[],
        fn: DataHandlingFn,
    ): void {
        for (const componentInitialization of components) {
            let clazz;
            let data;

            if (Array.isArray(componentInitialization)) {
                [clazz, data] = componentInitialization;
            } else {
                clazz = componentInitialization;
            }

            fn(entity, clazz, data);
        }
    }

    addComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
    ): C {
        const clazz = this.getClazz(clazzOrTag);
        const component = new clazz(this, entity, clazz);

        if (data !== undefined) {
            this.componentRegistry.validateComponentData(clazz, data);
            component.setData(data);
        }

        entity.addLocalComponent(component);

        const tagComponents = this.getOrCreateComponentTypeSet(clazz);
        tagComponents.add(component);

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter !== undefined) {
            componentEmitter.emit(RegistryEvent.COMPONENT_ADDED, component);
        }
        this.emitter.emit(RegistryEvent.COMPONENT_ADDED, component);

        return component;
    }

    addComponents(entity: Entity, components: ComponentInitialization[]): void {
        this.runForComponentInitialization(entity, components, this.addComponent);
    }

    updateComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
    ): C {
        const clazz = this.getClazz(clazzOrTag);
        const component = entity.getComponent(clazz);

        if (data !== undefined) {
            this.componentRegistry.validateComponentData(clazz, data);
            component.setData(data);
        }

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter !== undefined) {
            componentEmitter.emit(RegistryEvent.COMPONENT_UPDATED, component);
        }
        this.emitter.emit(RegistryEvent.COMPONENT_UPDATED, component);


        return component;
    }

    updateComponents(entity: Entity, components: ComponentInitialization[]): void {
        this.runForComponentInitialization(entity, components, this.updateComponent);
    }

    upsertComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
    ): C {
        const clazz = this.getClazz(clazzOrTag);
        const component = entity.findComponent(clazz);
        if (component === undefined) {
            return this.addComponent(entity, clazz, data);
        } else {
            return this.updateComponent(entity, clazz, data);
        }
    }

    upsertComponents(entity: Entity, components: ComponentInitialization[]): void {
        this.runForComponentInitialization(entity, components, this.updateComponent);
    }

    removeEntityComponent<C extends Component<C>>(
        entity: Entity,
        clazz: ComponentClassType<C>,
    ): C {
        const component = entity.removeLocalComponent(clazz);

        const tagComponents = this.tagsComponentsMap.get(clazz.tag);
        assert(tagComponents !== undefined);

        const tagsHasComponent = tagComponents.has(component);
        assert(tagsHasComponent);

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter !== undefined) {
            componentEmitter.emit(RegistryEvent.COMPONENT_BEFORE_REMOVE, component);
        }
        this.emitter.emit(RegistryEvent.COMPONENT_BEFORE_REMOVE, component);

        const tagsHadComponent = tagComponents.delete(component);
        assert(tagsHadComponent);

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
        assert(entity !== undefined);
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
