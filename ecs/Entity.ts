import { assert } from '@/utils/assert';
import { Component, ComponentClassType, ComponentInitialization } from './Component';
import { EntityId } from './EntityId';
import { Registry } from './Registry';

export class Entity {
    private tagComponentMap = new Map<ComponentClassType, Component<any>>();

    id: EntityId;

    constructor(id: EntityId, private registry: Registry) {
        this.id = id;
    }

    addLocalComponent<C extends Component<C>>(
        component: C,
    ): void {
        const existingComponent = this.findComponent(component.clazz);
        assert(existingComponent === undefined);

        this.tagComponentMap.set(component.clazz, component);
    }

    getLocalComponents(): IterableIterator<Component<any>> {
        return this.tagComponentMap.values();
    }

    removeLocalComponent<C extends Component<C>>(
        clazz: ComponentClassType<C>,
    ): C {
        const component = this.tagComponentMap.get(clazz);
        assert(component !== undefined);

        const hadComponent = this.tagComponentMap.delete(clazz);
        assert(hadComponent);

        return component as C;
    }

    addComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
    ): C {
        return this.registry.addComponent(this, clazzOrTag, data);
    }

    updateComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
    ): C {
        return this.registry.updateComponent(this, clazzOrTag, data);
    }

    upsertComponent<
        C extends Component<C>,
    >(
        clazz: ComponentClassType<C> | string,
        data?: Record<string, any>,
    ): C {
        return this.registry.upsertComponent(this, clazz, data);
    }

    addComponents(components: ComponentInitialization[]): void {
        this.registry.addComponents(this, components);
    }

    getComponentsData(): [string, Partial<Component<any>>][] {
        const tagsComponentsEncoding: [string, Partial<Component<any>>][] = [];
        for (const [clazz, component] of this.tagComponentMap) {
            tagsComponentsEncoding.push([clazz.tag, component.getData()]);
        }
        return tagsComponentsEncoding;
    }

    removeComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
    ): C {
        const component = this.getComponent(clazzOrTag);
        return this.registry.removeComponent(component);
    }

    removeComponents(): void {
        for (const component of this.tagComponentMap.values()) {
            this.registry.removeComponent(component);
        }
    }

    findComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
    ): C | undefined {
        let clazz;
        if (typeof clazzOrTag === 'string') {
            clazz = this.registry.getClazz(clazzOrTag);
        } else {
            clazz = clazzOrTag;
        }

        return this.tagComponentMap.get(clazz) as C;
    }

    getComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
    ): C {
        const component = this.findComponent(clazzOrTag);
        assert(component !== undefined);
        return component;
    }

    hasComponent<C extends Component<C>>(clazz: ComponentClassType<C>): boolean {
        const component = this.findComponent(clazz);
        return component !== undefined;
    }
}
