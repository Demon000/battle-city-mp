import { assert } from '@/utils/assert';
import { Component, ComponentClassType, ComponentInitialization } from './Component';
import { EntityId } from './EntityId';
import { Registry, RegistryOperationOptions } from './Registry';

export interface EntityComponentsOptions {
    withFlags?: number;
    withoutFlags?: number;
}

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
        assert(existingComponent === undefined,
            'Component already exists on entity', component, this);

        this.tagComponentMap.set(component.clazz, component);
    }

    removeLocalComponent<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        optional = false,
    ): C | undefined {
        const component = this.tagComponentMap.get(clazz);
        if (optional && component === undefined) {
            return undefined;
        }
        assert(component !== undefined);

        const hadComponent = this.tagComponentMap.delete(clazz);
        if (optional && !hadComponent) {
            return undefined;
        }
        assert(hadComponent);

        return component as C;
    }

    addComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.addComponent(this, clazzOrTag, data, options);
    }

    updateComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
        data?: Record<string, any>,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.updateComponent(this, clazzOrTag, data, options);
    }

    upsertComponent<
        C extends Component<C>,
    >(
        clazz: ComponentClassType<C> | string,
        data?: Record<string, any>,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.upsertComponent(this, clazz, data, options);
    }

    addComponents(
        components: ComponentInitialization[],
        options?: RegistryOperationOptions,
    ): void {
        this.registry.addComponents(this, components, options);
    }

    updateComponents(
        components: ComponentInitialization[],
        options?: RegistryOperationOptions,
    ): void {
        this.registry.updateComponents(this, components, options);
    }

    upsertComponents(
        components: ComponentInitialization[],
        options?: RegistryOperationOptions,
    ): void {
        this.registry.upsertComponents(this, components, options);
    }

    getComponentsData(options?: EntityComponentsOptions): ComponentInitialization[] {
        const tagsComponentsEncoding: [string, Partial<Component<any>>][] = [];
        for (const [clazz, component] of this.tagComponentMap) {
            if (options !== undefined) {
                if (options.withFlags !== undefined
                    && (component.flags & options.withFlags)
                        !== options.withFlags) {
                    continue;
                }

                if (options.withoutFlags !== undefined
                    && (component.flags & options.withoutFlags)
                        !== 0) {
                    continue;
                }
            }
            tagsComponentsEncoding.push([clazz.tag, component.getData()]);
        }
        return tagsComponentsEncoding;
    }

    removeComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ComponentClassType<C> | string,
        options?: RegistryOperationOptions,
    ): C | undefined {
        const component = this.getComponent(clazzOrTag);
        return this.registry.removeComponent(component, options);
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

    destroy(): void {
        this.registry.destroyEntity(this);
    }
}
