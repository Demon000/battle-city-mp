import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import Component from './Component';
import Entity from './Entity';
import RegistryIDGenerator from './RegistryIdGenerator';
import RegistryViewIterator from './RegistryViewIterator';

export enum RegistryEvent {
    COMPONENT_ATTACHED = 'component-attached',
    COMPONENT_DETACHED = 'component-detached',
}

export interface RegistryEvents {
    [RegistryEvent.COMPONENT_ATTACHED]: (registry: Registry, tag: string, component: Component) => void;
    [RegistryEvent.COMPONENT_DETACHED]: (registry: Registry, tag: string, component: Component) => void;
}

export default class Registry {
    private idGenerator;
    private tagsComponentsMap = new Map<string, Set<Component>>();
    private componentsEntitiesMap = new Map<Component, Entity>();
    private entitiesComponentsMap = new Map<Entity, Map<string, Component>>();
    emitter = new EventEmitter<RegistryEvents>();

    constructor(idGenerator: RegistryIDGenerator) {
        this.idGenerator = idGenerator;
    }

    registerEntity(entity: Entity): void {
        assert(!this.entitiesComponentsMap.has(entity));
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
            this.detachComponent(entity, tag);
        }
    }

    getOrCreateTagComponents(tag: string): Set<Component> {
        let tagComponents = this.tagsComponentsMap.get(tag);
        if (tagComponents === undefined) {
            tagComponents = new Set<Component>();
            this.tagsComponentsMap.set(tag, tagComponents);
        }

        return tagComponents;
    }

    attachComponent(entity: Entity, tag: string, value: any): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        const component = new Component(value);
        assert(!componentsMap.has(tag));
        componentsMap.set(tag, component);

        const tagComponents = this.getOrCreateTagComponents(tag);
        tagComponents.add(component);

        this.componentsEntitiesMap.set(component, entity);

        this.emitter.emit(RegistryEvent.COMPONENT_ATTACHED, this, tag, component);
    }

    detachComponent(entity: Entity, tag: string): void {
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

        const componentHadEntity = this.componentsEntitiesMap.delete(component);
        assert(componentHadEntity);

        this.emitter.emit(RegistryEvent.COMPONENT_DETACHED, this, tag, component);
    }

    findComponent(entity: Entity, tag: string): Component | undefined {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        return componentsMap.get(tag);
    }

    hasComponent(entity: Entity, tag: string): boolean {
        const component = this.findComponent(entity, tag);
        return component !== undefined;
    }

    getComponent(entity: Entity, tag: string): Component {
        const component = this.findComponent(entity, tag);
        assert(component);
        return component;
    }

    getEntity(component: Component): Entity {
        const entity = this.componentsEntitiesMap.get(component);
        assert(entity);
        return entity;
    }

    getEntities(): IterableIterator<Entity> {
        return this.entitiesComponentsMap.keys();
    }

    getComponents(tag: string): IterableIterator<Component> {
        return this.getOrCreateTagComponents(tag).keys();
    }

    getView(tag: string, ...tags: string[]): Iterable<Entity> {
        const components = this.getComponents(tag);

        const that = this;
        return {
            [Symbol.iterator](): Iterator<Entity> {
                return new RegistryViewIterator(that, components, tags);
            },
        };
    }
}
