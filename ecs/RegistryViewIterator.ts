import { Component, ComponentClassType } from './Component';
import { Entity } from './Entity';

export class RegistryViewIterator implements Iterator<Entity> {
    constructor(
        private components: IterableIterator<Component<any>>,
        private clazzes: ComponentClassType[],
    ) {}

    next(): IteratorResult<Entity, undefined> {
        let currentComponent;
        let foundEntity;
        while ((currentComponent = this.components.next().value)) {
            let hasAllComponents = true;

            for (const clazz of this.clazzes) {
                if (!currentComponent.entity.hasComponent(clazz)) {
                    hasAllComponents = false;
                    break;
                }
            }

            if (!hasAllComponents) {
                continue;
            }

            foundEntity = currentComponent.entity;
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
