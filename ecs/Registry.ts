import { ComponentRegistry } from './ComponentRegistry';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { ClazzOrTag, Component, ComponentClassType, ComponentsInitialization } from './Component';
import { Entity } from './Entity';
import { EntityId } from './EntityId';
import { RegistryIdGenerator } from './RegistryIdGenerator';
import { LazyIterable } from '@/utils/LazyIterable';

export enum RegistryEvent {
    ENTITY_REGISTERED = 'entity-registered',
    ENTITY_BEFORE_DESTROY = 'entity-before-destroy',
    ENTITY_DESTROYED = 'entity-destroyed',
}

export enum RegistryComponentEvent {
    COMPONENT_ADDED = 'component-added',
    COMPONENT_UPDATED = 'component-updated',
    COMPONENT_BEFORE_REMOVE = 'component-before-remove',
    COMPONENT_REMOVED = 'component-removed',
}

export interface RegistryOperationOptions {
    flags?: number;
    silent?: boolean;
    optional?: boolean;
}

export interface RegistryEvents {
    [RegistryEvent.ENTITY_REGISTERED]: (entity: Entity) => void;
    [RegistryEvent.ENTITY_BEFORE_DESTROY]: (entity: Entity) => void;
    [RegistryEvent.ENTITY_DESTROYED]: (entity: Entity) => void;
}

export interface RegistryComponentEvents {
    [RegistryComponentEvent.COMPONENT_ADDED]: <C extends Component<C>>(
        component: C,
        data?: any,
    ) => void;
    [RegistryComponentEvent.COMPONENT_UPDATED]: <C extends Component<C>>(
        component: C,
        data?: any,
    ) => void;
    [RegistryComponentEvent.COMPONENT_BEFORE_REMOVE]: <C extends Component<C>>(
        component: C,
    ) => void;
    [RegistryComponentEvent.COMPONENT_REMOVED]: <C extends Component<C>>(
        component: C,
    ) => void;
}

export type DataHandlingFn = <C extends Component<C>>(
    entity: Entity,
    clazzOrTag: ClazzOrTag<C>,
    data?: any,
    options?: RegistryOperationOptions,
) => C;

export class Registry {
    private tagsComponentsMap = new Map<string, Set<Component<any>>>();
    private componentsEmitterMap = new Map<string, EventEmitter<RegistryComponentEvents>>();

    private idsEntityMap = new Map<EntityId, Entity>();
    emitter = new EventEmitter<RegistryEvents & RegistryComponentEvents>();

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
        const entityIdExists = this.idsEntityMap.has(entity.id);
        assert(!entityIdExists);
        this.idsEntityMap.set(entity.id, entity);

        this.emitter.emit(RegistryEvent.ENTITY_REGISTERED, entity);
    }

    registerEntities(entities: Iterable<Entity>): void {
        for (const entity of entities) {
            this.registerEntity(entity);
        }
    }

    generateId(): EntityId {
        return this.idGenerator.generate();
    }

    destroyEntity(entity: Entity): void {
        entity.removeComponents();
        const entityIdExists = this.idsEntityMap.has(entity.id);
        assert(entityIdExists);

        this.emitter.emit(RegistryEvent.ENTITY_BEFORE_DESTROY, entity);

        const entityIdExisted = this.idsEntityMap.delete(entity.id);
        assert(entityIdExisted);

        this.emitter.emit(RegistryEvent.ENTITY_DESTROYED, entity);
    }

    destroyAllEntities(): void {
        const entities = this.getEntities();
        for (const entity of entities) {
            this.destroyEntity(entity);
        }
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

    getClazz<
        C extends Component<C>,
    >(clazzOrTag: ClazzOrTag<C>): ComponentClassType<C> {
        let clazz;
        if (typeof clazzOrTag === 'string') {
            clazz = this.componentRegistry.getComponentClassByTag(clazzOrTag);
        } else {
            clazz = clazzOrTag;
        }

        return clazz;
    }

    private emit<
        C extends Component<C>,
    >(event: RegistryComponentEvent, component: C, data?: any): void {
        const componentEmitter = this.componentEmitter(component.clazz);
        if (componentEmitter !== undefined) {
            componentEmitter.emit(event, component, data);
        }

        this.emitter.emit(event, component, data);
    }

    runForComponentsInitialization(
        entity: Entity,
        components: ComponentsInitialization,
        fn: DataHandlingFn,
        options?: RegistryOperationOptions,
    ): void {
        for (const [clazzOrTag, data] of Object.entries(components)) {
            fn(entity, clazzOrTag, data, options);
        }
    }

    addComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
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

        if (options !== undefined && options.flags !== undefined
            && options.flags) {
            component.flags = options.flags;
        }

        if (!options?.silent) {
            this.emit(RegistryComponentEvent.COMPONENT_ADDED, component, data);
        }

        return component;
    }

    addComponents(
        entity: Entity,
        components: ComponentsInitialization,
        options?: RegistryOperationOptions,
    ): void {
        this.runForComponentsInitialization(entity, components,
            this.addComponent, options);
    }

    updateComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        const clazz = this.getClazz(clazzOrTag);
        const component = entity.getComponent(clazz);

        if (data !== undefined) {
            this.componentRegistry.validateComponentData(clazz, data);
            component.setData(data);
        }

        if (!options?.silent) {
            this.emit(RegistryComponentEvent.COMPONENT_UPDATED, component, data);
        }

        return component;
    }

    updateComponents(
        entity: Entity,
        components: ComponentsInitialization,
        options?: RegistryOperationOptions,
    ): void {
        this.runForComponentsInitialization(entity, components,
            this.updateComponent, options);
    }

    upsertComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        const clazz = this.getClazz(clazzOrTag);
        const component = entity.findComponent(clazz);
        if (component === undefined) {
            return this.addComponent(entity, clazz, data, options);
        } else {
            return this.updateComponent(entity, clazz, data, options);
        }
    }

    upsertComponents(
        entity: Entity,
        components: ComponentsInitialization,
        options?: RegistryOperationOptions,
    ): void {
        this.runForComponentsInitialization(entity, components,
            this.upsertComponent, options);
    }

    private removeEntityComponent<C extends Component<C>>(
        entity: Entity,
        clazz: ComponentClassType<C>,
        options?: RegistryOperationOptions,
    ): C | undefined {
        let component = entity.findComponent(clazz);
        if (options?.optional && component === undefined) {
            return undefined;
        }
        assert(component !== undefined);

        if (!options?.silent) {
            this.emit(RegistryComponentEvent.COMPONENT_BEFORE_REMOVE, component);
        }

        component = entity.removeLocalComponent(clazz);
        if (options?.optional && component === undefined) {
            return undefined;
        }
        assert(component !== undefined);

        const tagComponents = this.tagsComponentsMap.get(clazz.tag);
        if (options?.optional && tagComponents === undefined) {
            return undefined;
        }
        assert(tagComponents !== undefined);

        const tagsHasComponent = tagComponents.has(component);
        if (options?.optional && !tagsHasComponent) {
            return undefined;
        }
        assert(tagsHasComponent);

        const tagsHadComponent = tagComponents.delete(component);
        assert(tagsHadComponent);

        if (!options?.silent) {
            this.emit(RegistryComponentEvent.COMPONENT_REMOVED, component);
        }

        return component;
    }

    removeComponent<C extends Component<C>>(
        component: C,
        options?: RegistryOperationOptions,
    ): C | undefined {
        return this.removeEntityComponent(component.entity, component.clazz, options);
    }

    removeComponentIfExists<C extends Component<C>>(
        component: C,
        options?: RegistryOperationOptions,
    ): C | undefined {
        return this.removeEntityComponent(component.entity, component.clazz, {
            ...options,
            optional: true,
        });
    }

    findEntityById(id: EntityId): Entity | undefined {
        return this.idsEntityMap.get(id);
    }

    getEntityById(id: EntityId): Entity {
        const entity = this.findEntityById(id);
        assert(entity !== undefined, `Entity with id ${id} is not registered`);
        return entity;
    }

    getMultipleEntitiesById(ids: Iterable<EntityId>): Iterable<Entity> {
        return LazyIterable.from(ids)
            .map(id => this.getEntityById(id));
    }

    getEntities(): Iterable<Entity> {
        return this.idsEntityMap.values();
    }

    getComponents<C extends Component<C>>(
        clazz: ComponentClassType<C>,
    ): Iterable<C> {
        return this.getOrCreateComponentTypeSet(clazz).keys() as Iterable<C>;
    }

    getEntitiesWithComponent<C extends Component<C>>(
        clazz: ComponentClassType<C>,
    ): Iterable<Entity> {
        const components = this.getComponents(clazz);
        return LazyIterable.from(components)
            .map(component => component.entity);
    }
}
