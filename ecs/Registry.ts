import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { Component, ComponentClassType } from './Component';
import Entity from './Entity';
import { EntityId } from './EntityId';
import RegistryIDGenerator from './RegistryIdGenerator';
import RegistryViewIterator from './RegistryViewIterator';

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
    [RegistryEvent.COMPONENT_ADDED]: <T extends Component>(
        registry: Registry,
        component: T,
    ) => void;
    [RegistryEvent.COMPONENT_REMOVED]: <T extends Component>(
        registry: Registry,
        component: T,
    ) => void;
}

export default class Registry {
    private idGenerator;
    private tagsComponentsMap = new Map<string, Set<Component>>();
    private componentsEntityMap = new Map<Component, Entity>();
    private entitiesComponentsMap = new Map<Entity, Map<string, Component>>();
    private componentsEmitterMap = new Map<string, EventEmitter<RegistryComponentEvents>>();
    private tagsToComponentTypeMap = new Map<string, ComponentClassType>();
    private idsToEntityMap = new Map<EntityId, Entity>();
    emitter = new EventEmitter<RegistryEvents>();

    constructor(idGenerator: RegistryIDGenerator) {
        this.idGenerator = idGenerator;
    }

    componentEmitter<T extends Component>(
        clazz: ComponentClassType<T>,
        create?: false,
    ): EventEmitter<RegistryComponentEvents> | undefined;
    componentEmitter<T extends Component>(
        clazz: ComponentClassType<T>,
        create: true,
    ): EventEmitter<RegistryComponentEvents>;
    componentEmitter<T extends Component>(
        clazz: ComponentClassType<T>,
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
        assert(!this.entitiesComponentsMap.has(entity));
        assert(!this.idsToEntityMap.has(entity.id));
        this.entitiesComponentsMap.set(entity, new Map<string, Component>());
        this.idsToEntityMap.set(entity.id, entity);
    }

    createEntity(): Entity {
        const id = this.idGenerator.generate();
        const entity = new Entity(id);
        this.registerEntity(entity);
        return entity;
    }

    destroyEntity(entity: Entity): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        const existed = this.entitiesComponentsMap.delete(entity);
        assert(existed);

        for (const tag of componentsMap.keys()) {
            const componentType = this.tagsToComponentTypeMap.get(tag);
            assert(componentType);
            this.removeComponent(entity, componentType);
        }

        const entityIdExisted = this.idsToEntityMap.delete(entity.id);
        assert(entityIdExisted);
    }

    private getOrCreateComponentTypeSet<T extends Component>(
        clazz: ComponentClassType<T>,
    ): Set<Component> {
        let tagComponents = this.tagsComponentsMap.get(clazz.tag);
        if (tagComponents === undefined) {
            tagComponents = new Set<Component>();
            this.tagsComponentsMap.set(clazz.tag, tagComponents);
        }

        return tagComponents;
    }

    addComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        const component = new clazz(this, entity);
        assert(!componentsMap.has(clazz.tag));
        componentsMap.set(clazz.tag, component);

        const tagComponents = this.getOrCreateComponentTypeSet(clazz);
        tagComponents.add(component);

        this.componentsEntityMap.set(component, entity);

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter) {
            componentEmitter.emit(RegistryEvent.COMPONENT_ADDED, this, component);
        }
    }

    removeComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        const component = componentsMap.get(clazz.tag);
        assert(component);

        const entityHadTag = componentsMap.delete(clazz.tag);
        assert(entityHadTag);

        const tagComponents = this.tagsComponentsMap.get(clazz.tag);
        assert(tagComponents);

        const tagsHadComponent = tagComponents.delete(component);
        assert(tagsHadComponent);

        const componentHadEntity = this.componentsEntityMap.delete(component);
        assert(componentHadEntity);

        const componentEmitter = this.componentEmitter(clazz);
        if (componentEmitter) {
            componentEmitter.emit(RegistryEvent.COMPONENT_REMOVED, this, component);
        }
    }

    findComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): T | undefined {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        return componentsMap.get(clazz.tag) as T;
    }

    hasComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): boolean {
        const component = this.findComponent(entity, clazz);
        return component !== undefined;
    }

    getComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): T | undefined {
        const component = this.findComponent<T>(entity, clazz);
        assert(component);
        return component;
    }

    findSiblingComponent<S extends Component, T extends Component>(
        ofComponent: S,
        clazz: ComponentClassType<T>,
    ): T | undefined {
        const entity = this.getComponentEntity(ofComponent);
        return this.getComponent(entity, clazz);
    }

    getSiblingComponent<S extends Component, T extends Component>(
        ofComponent: S,
        clazz: ComponentClassType<T>,
    ): T {
        const component = this.findSiblingComponent(ofComponent, clazz);
        assert(component);
        return component;
    }

    getComponentEntity<T extends Component>(component: T): Entity {
        const entity = this.componentsEntityMap.get(component);
        assert(entity);
        return entity;
    }

    findEntityById(id: EntityId): Entity | undefined {
        return this.idsToEntityMap.get(id);
    }

    getEntityById(id: EntityId): Entity {
        const entity = this.getEntityById(id);
        assert(entity);
        return entity;
    }

    getEntities(): IterableIterator<Entity> {
        return this.entitiesComponentsMap.keys();
    }

    getComponents<T extends Component>(
        clazz: ComponentClassType<T>,
    ): IterableIterator<Component> {
        return this.getOrCreateComponentTypeSet(clazz).keys();
    }

    getView<T extends Component>(
        clazz: ComponentClassType<T>,
        ...clazzes: ComponentClassType[]
    ): Iterable<Entity> {
        return {
            [Symbol.iterator]: () => new RegistryViewIterator(
                this,
                this.getComponents(clazz),
                clazzes,
            ),
        };
    }
}
