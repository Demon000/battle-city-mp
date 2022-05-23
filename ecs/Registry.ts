import { ComponentRegistry } from './ComponentRegistry';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { ClazzOrTag, Component, ComponentClassType, ComponentFlags, ComponentsInitialization } from './Component';
import { Entity } from './Entity';
import { EntityId } from './EntityId';
import { RegistryIdGenerator } from './RegistryIdGenerator';
import { LazyIterable } from '@/utils/LazyIterable';
import { nonenumerable } from '@/utils/enumerable';

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
        data: any,
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

    attachComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        component: C,
        options?: RegistryOperationOptions,
    ): void {
        entity.addLocalComponent(component);

        const tagComponents = this.getOrCreateComponentTypeSet(component.clazz);
        if (options === undefined || options.flags === undefined
            || !(options.flags & ComponentFlags.SHARED)) {
            tagComponents.add(component);
        }

        if (!options?.silent) {
            this.emit(RegistryComponentEvent.COMPONENT_INITIALIZED, component);
            this.emit(RegistryComponentEvent.COMPONENT_ADDED, component);
        }
    }

    createComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
        entity?: Entity,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        if (data === undefined) {
            data = {};
        }

        const clazz = this.validateComponentData(clazzOrTag, data);
        const component = new clazz(this, clazz, entity);

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
        return this.createComponent(clazzOrTag, undefined, data, options);
    }

    addComponent<
        C extends Component<C>,
    >(
        entity: Entity,
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        const component = this.createComponent(clazzOrTag, entity, data, options);
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

        return component;
    }

    removeComponent<C extends Component<C>>(
        component: C,
        options?: RegistryOperationOptions,
    ): C | undefined {
        return this.removeEntityComponent(component.entity, component.clazz, options);
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
            .map(component => component.entity);
    }

    lookup(clazzOrTag: ClazzOrTag, data?: any): ComponentClassType<any> {
        return this.componentRegistry.lookup(clazzOrTag, data);
    }
}
