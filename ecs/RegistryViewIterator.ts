import { Component, ComponentClassType } from './Component';
import Entity from './Entity';
import Registry from './Registry';

export default class RegistryViewIterator implements Iterator<Entity> {
    private registry;
    private components;
    private clazzes;

    constructor(
        registry: Registry,
        components: IterableIterator<Component>,
        clazzes: ComponentClassType[],
    ) {
        this.registry = registry;
        this.components = components;
        this.clazzes = clazzes;
    }

    next(): IteratorResult<Entity, undefined> {
        let currentComponent;
        let foundEntity;
        while ((currentComponent = this.components.next().value)) {
            const entity = this.registry.getEntity(currentComponent);
            let hasAllTags = true;

            for (const clazz of this.clazzes) {
                if (!this.registry.hasComponent(entity, clazz)) {
                    hasAllTags = false;
                    break;
                }
            }

            if (!hasAllTags) {
                continue;
            }

            foundEntity = entity;
            break;
        }

        if (foundEntity) {
            return {
                value: foundEntity,
                done: false,
            };
        }  else {
            return {
                value: undefined,
                done: true,
            };
        }
    }
}
