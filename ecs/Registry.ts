import { ComponentRegistry } from './ComponentRegistry';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { ClazzOrTag, Component, ComponentClassType, ComponentFlags, ComponentsInitialization } from './Component';
import { Entity } from './Entity';
import { EntityId } from './EntityId';
import { RegistryIdGenerator } from './RegistryIdGenerator';
import { LazyIterable } from '@/utils/LazyIterable';
import { nonenumerable } from '@/utils/enumerable';
import { EntityType } from '@/entity/EntityType';

export enum RegistryEvent {
    ENTITY_REGISTERED = 'entity-registered',
    ENTITY_BEFORE_DESTROY = 'entity-before-destroy',
}

export enum RegistryComponentEvent {
    COMPONENT_INITIALIZED = 'component-initialized',
    COMPONENT_ADDED = 'component-added',
    COMPONENT_UPDATED = 'component-updated',
    COMPONENT_BEFORE_REMOVE = 'component-before-remove',
    COMPONENT_CHANGED = 'component-changed',
    COMPONENT_ADD_OR_UPDATE = 'component-add-or-update',
}

export interface RegistryOperationOptions {
    flags?: number;
    silent?: boolean;
    optional?: boolean;
}

export interface ComponentEmitOptions {
    register?: boolean;
    destroy?: boolean;
}

export interface RegistryEvents {
    [RegistryEvent.ENTITY_REGISTERED]: (entity: Entity) => void;
    [RegistryEvent.ENTITY_BEFORE_DESTROY]: (entity: Entity) => void;
}

export interface RegistryComponentEvents<C extends Component<C> = any> {
    [RegistryComponentEvent.COMPONENT_INITIALIZED]: (
        component: C,
        options?: ComponentEmitOptions,
    ) => void;
    [RegistryComponentEvent.COMPONENT_ADDED]: (
        component: C,
        options?: ComponentEmitOptions,
    ) => void;
    [RegistryComponentEvent.COMPONENT_UPDATED]: (
        component: C,
        data?: any,
        options?: ComponentEmitOptions,
    ) => void;
    [RegistryComponentEvent.COMPONENT_BEFORE_REMOVE]: (
        component: C,
        options?: ComponentEmitOptions,
    ) => void;
    [RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE]: (
        event: RegistryComponentEvent,
        component: C,
        options?: ComponentEmitOptions,
    ) => void;
    [RegistryComponentEvent.COMPONENT_CHANGED]: (
        event: RegistryComponentEvent,
        component: C,
        data?: any,
        options?: ComponentEmitOptions,
    ) => void;
}

export type DataHandlingFn = <C extends Component<C>>(
    entity: Entity,
    clazzOrTag: ClazzOrTag<C>,
    data?: any,
    options?: RegistryOperationOptions,
) => C;

export class Registry {
    @nonenumerable
    private tagsComponentsMap = new Map<string, Set<Component<any>>>();

    @nonenumerable
    private componentsEmitterMap = new Map<string, EventEmitter<RegistryComponentEvents>>();

    @nonenumerable
    private sharedComponents: Map<ComponentClassType<any>, Component<any>> = new Map();

    @nonenumerable
    private sharedByTypeComponents: Map<EntityType, Map<ComponentClassType<any>, Component<any>>> = new Map();

    @nonenumerable
    private idsEntityMap = new Map<EntityId, Entity>();

    @nonenumerable
    private componentRegistry;

    emitter = new EventEmitter<RegistryEvents & RegistryComponentEvents>();

    constructor(
        componentRegistry: ComponentRegistry,
        private idGenerator: RegistryIdGenerator,
    ) {
        this.addComponent = this.addComponent.bind(this);
        this.updateComponent = this.updateComponent.bind(this);
        this.upsertComponent = this.upsertComponent.bind(this);

        this.componentRegistry = componentRegistry;
    }

    componentEmitter<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        create?: false,
    ): EventEmitter<RegistryComponentEvents<C>> | undefined;
    componentEmitter<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        create: true,
    ): EventEmitter<RegistryComponentEvents<C>>;
    componentEmitter<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        create?: boolean,
    ): EventEmitter<RegistryComponentEvents<C>> | undefined {
        let componentEmitter = this.componentsEmitterMap.get(clazz.tag);
        if (componentEmitter === undefined && create) {
            componentEmitter = new EventEmitter<RegistryComponentEvents>();
            this.componentsEmitterMap.set(clazz.tag, componentEmitter);
        }

        return componentEmitter;
    }

    registerEntity(
        entity: Entity,
        options?: RegistryOperationOptions,
    ): void {
        const entityIdExists = this.idsEntityMap.has(entity.id);
        assert(!entityIdExists);
        this.idsEntityMap.set(entity.id, entity);

        if (!options?.silent) {
            const components = entity.getComponents();
            this.emitForEachComponent(
                RegistryComponentEvent.COMPONENT_INITIALIZED,
                components,
                {
                    register: true,
                },
            );
            this.emitter.emit(RegistryEvent.ENTITY_REGISTERED, entity);
            this.emitForEachComponent(
                RegistryComponentEvent.COMPONENT_ADDED,
                components,
                {
                    register: true,
                },
            );
        }
    }

    generateId(): EntityId {
        return this.idGenerator.generate();
    }

    destroyEntity(
        entity: Entity,
        options?: RegistryOperationOptions,
    ): void {
        const entityIdExists = this.idsEntityMap.has(entity.id);
        assert(entityIdExists);

        if (!options?.silent) {
            const components = entity.getComponents();
            this.emitForEachComponent(
                RegistryComponentEvent.COMPONENT_BEFORE_REMOVE,
                components,
                {
                    destroy: true,
                },
            );
            this.emitter.emit(RegistryEvent.ENTITY_BEFORE_DESTROY, entity);
        }

        entity.removeComponents({
            ...options,
            silent: true,
        });

        const entityIdExisted = this.idsEntityMap.delete(entity.id);
        assert(entityIdExisted);
    }

    private getOrCreateComponentTypeSet<
        C extends Component<C>,
    >(
        clazz: ComponentClassType<C>,
    ): Set<Component<C>> {
        let tagComponents = this.tagsComponentsMap.get(clazz.tag);
        if (tagComponents === undefined) {
            tagComponents = new Set<Component<C>>();
            this.tagsComponentsMap.set(clazz.tag, tagComponents);
        }

        return tagComponents;
    }

    validateComponentData<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
    ): ComponentClassType<C> {
        return this.componentRegistry.lookup(clazzOrTag, data);
    }

    emit<
        C extends Component<C>,
    >(
        event: RegistryComponentEvent,
        component: C,
        data?: any,
        options?: ComponentEmitOptions,
    ): void {
        const componentEmitter = this.componentEmitter(component.clazz);
        if (componentEmitter !== undefined) {
            if (event === RegistryComponentEvent.COMPONENT_UPDATED) {
                componentEmitter.emit(event, component, data, options);
            } else {
                componentEmitter.emit(event, component, options);
            }

            if (event !== RegistryComponentEvent.COMPONENT_INITIALIZED) {
                componentEmitter.emit(RegistryComponentEvent.COMPONENT_CHANGED,
                    event, component, data, options);
            }

            if (event === RegistryComponentEvent.COMPONENT_ADDED
                || event === RegistryComponentEvent.COMPONENT_UPDATED) {
                componentEmitter.emit(
                    RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE,
                    event, component, options);
            }
        }

        if (event === RegistryComponentEvent.COMPONENT_UPDATED) {
            this.emitter.emit(event, component, data, options);
        } else {
            this.emitter.emit(event, component, options);
        }

        if (event !== RegistryComponentEvent.COMPONENT_INITIALIZED) {
            this.emitter.emit(RegistryComponentEvent.COMPONENT_CHANGED,
                event, component, data, options);
        }
    }


    emitForEachComponent(
        event: RegistryComponentEvent,
        components: Iterable<Component<any>>,
        options?: ComponentEmitOptions,
    ): void {
        assert(event !== RegistryComponentEvent.COMPONENT_UPDATED);

        for (const component of components) {
            this.emit(event, component, undefined, options);
        }
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

    private _addSharedComponent<
        C extends Component<C>,
    >(
        componentsMap: Map<ComponentClassType<any>, Component<any>>,
        component: C,
    ): void {
        assert(!componentsMap.has(component.clazz));

        componentsMap.set(component.clazz, component);
    }

    addSharedComponent<
        C extends Component<C>,
    >(
        component: C,
    ): void {
        if (!(component.flags & ComponentFlags.SHARED)) {
            return;
        }

        this._addSharedComponent(this.sharedComponents, component);
    }

    addSharedByTypeComponent<
        C extends Component<C>,
    >(
        type: EntityType,
        component: C,
    ): void {
        if (!(component.flags & ComponentFlags.SHARED_BY_TYPE)) {
            return;
        }

        let componentsMap = this.sharedByTypeComponents.get(type);
        if (componentsMap === undefined) {
            componentsMap = new Map();
            this.sharedByTypeComponents.set(type, componentsMap);
        }

        this._addSharedComponent(componentsMap, component);
    }

    _findSharedComponent<
        C extends Component<C>,
    >(
        componentsMap: Map<ComponentClassType<any>, Component<any>>,
        clazzOrTag: ClazzOrTag<C>,
    ): C | undefined {
        const clazz = this.validateComponentData(clazzOrTag);

        return componentsMap.get(clazz) as C;
    }

    findSharedComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
    ): C | undefined {
        return this._findSharedComponent(this.sharedComponents, clazzOrTag);
    }

    findSharedByTypeComponent<
        C extends Component<C>,
    >(
        type: EntityType,
        clazzOrTag: ClazzOrTag<C>,
    ): C | undefined {
        const componentsMap = this.sharedByTypeComponents.get(type);
        if (componentsMap === undefined) {
            return undefined;
        }

        return this._findSharedComponent(componentsMap, clazzOrTag);
    }

    attachComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        component: C,
        options?: RegistryOperationOptions,
    ): void {
        entity.addLocalComponent(component);

        const tagComponents = this.getOrCreateComponentTypeSet(component.clazz);
        tagComponents.add(component);

        component.attachToEntity(entity);

        if (!options?.silent) {
            this.emit(RegistryComponentEvent.COMPONENT_INITIALIZED, component);
            this.emit(RegistryComponentEvent.COMPONENT_ADDED, component);
        }
    }

    createComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        if (data === undefined) {
            data = {};
        }

        const clazz = this.validateComponentData(clazzOrTag, data);
        const component = new clazz(this, clazz);

        if (data !== undefined) {
            component.setData(data);
        }

        if (options !== undefined && options.flags !== undefined
            && options.flags) {
            component.flags = options.flags;
        }

        return component;
    }

    createDetachedComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        return this.createComponent(clazzOrTag, data, options);
    }

    addComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        const component = this.createComponent(clazzOrTag, data, options);
        this.attachComponent(entity, component, options);

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
        if (data === undefined) {
            data = {};
        }

        const clazz = this.validateComponentData(clazzOrTag, data);
        const component = entity.getComponent(clazz);

        if (data !== undefined) {
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
        const component = entity.findComponent(clazzOrTag);
        if (component === undefined) {
            return this.addComponent(entity, clazzOrTag, data, options);
        } else {
            return this.updateComponent(entity, clazzOrTag, data, options);
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

    detachEntityComponent<C extends Component<C>>(
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

        component.detachFromEntity(entity);

        component = entity.removeLocalComponent(clazz);
        if (options?.optional && component === undefined) {
            return undefined;
        }
        assert(component !== undefined);

        return component;
    }

    removeEntityComponent<C extends Component<C>>(
        entity: Entity,
        clazz: ComponentClassType<C>,
        options?: RegistryOperationOptions,
    ): C | undefined {
        const component = this.detachEntityComponent(entity, clazz, options);
        if (options?.optional && component === undefined) {
            return undefined;
        }
        assert(component !== undefined);

        if (component.flags & ComponentFlags.SHARED_BY_TYPE) {
            return component;
        }

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

        return component;
    }

    removeComponentIfExists<C extends Component<C>>(
        entity: Entity,
        clazzOrTag: ClazzOrTag,
        options?: RegistryOperationOptions,
    ): C | undefined {
        const component = entity.findComponent(clazzOrTag);
        if (component === undefined) {
            return;
        }

        return this.removeEntityComponent(component.entity, component.clazz, options);
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
            .map(component => component.entities)
            .flatten();
    }

    lookup(clazzOrTag: ClazzOrTag, data?: any): ComponentClassType<any> {
        return this.componentRegistry.lookup(clazzOrTag, data);
    }
}
