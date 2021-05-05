import Component from './Component';
import Entity from './Entity';
import Registry from './Registry';

export default class RegistryViewIterator implements Iterator<Entity> {
    private registry;
    private components;
    private tags;

    constructor(registry: Registry, components: IterableIterator<Component>, tags: string[]) {
        this.registry = registry;
        this.components = components;
        this.tags = tags;
    }

    next(): IteratorResult<Entity, undefined> {
        let currentComponent;
        let foundEntity;
        while (currentComponent = this.components.next().value) {
            const entity = this.registry.getEntity(currentComponent);
            let hasAllTags = true;

            for (const tag of this.tags) {
                if (!this.registry.hasComponent(entity, tag)) {
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
