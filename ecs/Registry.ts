import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { Component, ComponentClassType, ComponentOptions} from './Component';
import Entity from './Entity';
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
    private componentsEmitter = new Map<string, EventEmitter<RegistryComponentEvents>>();
    emitter = new EventEmitter<RegistryEvents>();

    constructor(idGenerator: RegistryIDGenerator) {
        this.idGenerator = idGenerator;
    }

    componentTagEmitter(
        tag: string,
        create?: false,
    ): EventEmitter<RegistryComponentEvents> | undefined;
    componentTagEmitter(
        tag: string,
        create: true,
    ): EventEmitter<RegistryComponentEvents>;
    componentTagEmitter(
        tag: string,
        create?: boolean,
    ): EventEmitter<RegistryComponentEvents> | undefined {
        let componentEmitter = this.componentsEmitter.get(tag);
        if (componentEmitter === undefined && create) {
            componentEmitter = new EventEmitter<RegistryComponentEvents>();
            this.componentsEmitter.set(tag, componentEmitter);
        }

        return componentEmitter;
    }

    componentEmitter<T extends Component>(
        clazz: ComponentClassType<T>,
    ): EventEmitter<RegistryComponentEvents> {
        return this.componentTagEmitter(clazz.tag, true);
    }

    registerEntity(entity: Entity): void {
        assert(!this.entitiesComponentsMap.has(entity));
        entity.__registry = this;
        this.entitiesComponentsMap.set(entity, new Map<string, Component>());
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
            this.removeComponentByTag(entity, tag);
        }
    }

    private getOrCreateTagComponents(tag: string): Set<Component> {
        let tagComponents = this.tagsComponentsMap.get(tag);
        if (tagComponents === undefined) {
            tagComponents = new Set<Component>();
            this.tagsComponentsMap.set(tag, tagComponents);
        }

        return tagComponents;
    }

    attachComponent(
        entity: Entity,
        tag: string,
        component: Component,
    ): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        assert(!componentsMap.has(tag));
        componentsMap.set(tag, component);

        const tagComponents = this.getOrCreateTagComponents(tag);
        tagComponents.add(component);

        this.componentsEntityMap.set(component, entity);

        const componentEmitter = this.componentTagEmitter(tag);
        if (componentEmitter) {
            componentEmitter.emit(RegistryEvent.COMPONENT_ADDED, this, component);
        }
    }

    addComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
        options: ComponentOptions = {},
    ): Component {
        const component = new clazz(this, entity);
        this.attachComponent(entity, clazz.tag, component);
        return component;
    }

    removeComponentByTag(entity: Entity, tag: string): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        const component = componentsMap.get(tag);
        assert(component);

        const entityHadTag = componentsMap.delete(tag);
        assert(entityHadTag);

        const tagComponents = this.tagsComponentsMap.get(tag);
        assert(tagComponents);

        const tagsHadComponent = tagComponents.delete(component);
        assert(tagsHadComponent);

        const componentHadEntity = this.componentsEntityMap.delete(component);
        assert(componentHadEntity);

        const componentEmitter = this.componentTagEmitter(tag);
        if (componentEmitter) {
            componentEmitter.emit(RegistryEvent.COMPONENT_REMOVED, this, component);
        }
    }

    removeComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): void {
        this.removeComponentByTag(entity, clazz.tag);
    }

    findComponentByTag<T extends Component>(
        entity: Entity,
        tag: string,
    ): T | undefined {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        return componentsMap.get(tag) as T;
    }

    findComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): T | undefined {
        return this.findComponentByTag<T>(entity, clazz.tag);
    }

    hasComponentByTag(entity: Entity, tag: string): boolean {
        const component = this.findComponentByTag(entity, tag);
        return component !== undefined;
    }

    hasComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): boolean {
        return this.hasComponentByTag(entity, clazz.tag);
    }

    getComponentByTag<T extends Component>(entity: Entity, tag: string): T {
        const component = this.findComponentByTag<T>(entity, tag);
        assert(component);
        return component;
    }

    getComponent<T extends Component>(
        entity: Entity,
        clazz: ComponentClassType<T>,
    ): T | undefined {
        return this.getComponentByTag<T>(entity, clazz.tag);
    }

    getEntity<T extends Component>(component: T): Entity {
        const entity = this.componentsEntityMap.get(component);
        assert(entity);
        return entity;
    }

    getEntities(): IterableIterator<Entity> {
        return this.entitiesComponentsMap.keys();
    }

    getComponents<T extends Component>(
        clazz: ComponentClassType<T>,
    ): IterableIterator<Component> {
        return this.getOrCreateTagComponents(clazz.tag).keys();
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
