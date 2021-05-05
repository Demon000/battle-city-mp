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
    [RegistryEvent.COMPONENT_ATTACHED]: (registry: Registry, tag: string, component: Component<any>) => void;
    [RegistryEvent.COMPONENT_DETACHED]: (registry: Registry, tag: string, component: Component<any>) => void;
}

export default class Registry {
    private idGenerator;
    private tagsComponentsMap = new Map<string, Set<Component<any>>>();
    private componentsEntitiesMap = new Map<Component<any>, Entity>();
    private entitiesComponentsMap = new Map<Entity, Map<string, Component<any>>>();
    emitter = new EventEmitter<RegistryEvents>();

    constructor(idGenerator: RegistryIDGenerator) {
        this.idGenerator = idGenerator;
    }

    registerEntity(entity: Entity): void {
        assert(!this.entitiesComponentsMap.has(entity));
        this.entitiesComponentsMap.set(entity, new Map<string, Component<any>>());
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

    getOrCreateTagComponents(tag: string): Set<Component<any>> {
        let tagComponents = this.tagsComponentsMap.get(tag);
        if (tagComponents === undefined) {
            tagComponents = new Set<Component<any>>();
            this.tagsComponentsMap.set(tag, tagComponents);
        }

        return tagComponents;
    }

    attachComponent<T>(entity: Entity, tag: string, value: T): void {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        const component = new Component<T>(value);
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

    findComponent(entity: Entity, tag: string): Component<any> | undefined {
        const componentsMap = this.entitiesComponentsMap.get(entity);
        assert(componentsMap);

        return componentsMap.get(tag);
    }

    hasComponent(entity: Entity, tag: string): boolean {
        const component = this.findComponent(entity, tag);
        return component !== undefined;
    }

    getComponent(entity: Entity, tag: string): Component<any> {
        const component = this.findComponent(entity, tag);
        assert(component);
        return component;
    }

    getEntity(component: Component<any>): Entity {
        const entity = this.componentsEntitiesMap.get(component);
        assert(entity);
        return entity;
    }

    getEntities(): IterableIterator<Entity> {
        return this.entitiesComponentsMap.keys();
    }

    getComponents(tag: string): IterableIterator<Component<any>> {
        return this.getOrCreateTagComponents(tag).keys();
    }

    getView(tag: string, ...tags: string[]): Iterable<Entity> {
        return {
            [Symbol.iterator]: () => new RegistryViewIterator(
                this,
                this.getComponents(tag),
                tags,
            ),
        };
    }
}
