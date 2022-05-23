import { assert } from '@/utils/assert';
import { ClazzOrTag, Component, ComponentClassType, ComponentsInitialization } from './Component';
import { EntityId } from './EntityId';
import { Registry, RegistryOperationOptions } from './Registry';

export interface EntityComponentsOptions {
    withFlags?: number;
    withoutFlags?: number;
}

export class Entity {
    private tagComponentMap = new Map<string, Component<any>>();

    constructor(
        private registry: Registry,
        public id: EntityId,
        public type: string,
        public subtypes: string[] = [],
    ) {}

    addLocalComponent<C extends Component<C>>(
        component: C,
    ): void {
        const existingComponent = this.findComponent(component.clazz);
        assert(existingComponent === undefined,
            'Component already exists on entity', component, this);

        this.tagComponentMap.set(component.clazz.tag, component);
    }

    removeLocalComponent<C extends Component<C>>(
        clazz: ComponentClassType<C>,
        optional = false,
    ): C | undefined {
        const component = this.tagComponentMap.get(clazz.tag);
        if (optional && component === undefined) {
            return undefined;
        }
        assert(component !== undefined);

        const hadComponent = this.tagComponentMap.delete(clazz.tag);
        if (optional && !hadComponent) {
            return undefined;
        }
        assert(hadComponent);

        return component as C;
    }

    addComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.addComponent(this, clazzOrTag, data, options);
    }

    attachComponent<
        C extends Component<C>,
    >(
        component: C,
        options?: RegistryOperationOptions,
    ): void {
        return this.registry.attachComponent(this, component, options);
    }

    updateComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.updateComponent(this, clazzOrTag, data, options);
    }

    upsertComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.upsertComponent(this, clazzOrTag, data, options);
    }

    addComponents(
        components: ComponentsInitialization,
        options?: RegistryOperationOptions,
    ): void {
        this.registry.addComponents(this, components, options);
    }

    updateComponents(
        components: ComponentsInitialization,
        options?: RegistryOperationOptions,
    ): void {
        this.registry.updateComponents(this, components, options);
    }

    upsertComponents(
        components: ComponentsInitialization,
        options?: RegistryOperationOptions,
    ): void {
        this.registry.upsertComponents(this, components, options);
    }

    getComponentsData(options?: EntityComponentsOptions): ComponentsInitialization {
        const componentsInitialization: ComponentsInitialization = {};
        for (const [tag, component] of this.tagComponentMap) {
            if (options?.withFlags !== undefined
                && (component.flags & options.withFlags)
                    !== options.withFlags) {
                continue;
            }

            if (options?.withoutFlags !== undefined
                && (component.flags & options.withoutFlags)
                    !== 0) {
                continue;
            }
            componentsInitialization[tag] = component.getData();
        }
        return componentsInitialization;
    }

    removeComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
        options?: RegistryOperationOptions,
    ): C | undefined {
        const component = this.getComponent(clazzOrTag);
        return this.registry.removeEntityComponent(this, component.clazz, options);
    }

    removeComponents(options?: RegistryOperationOptions): void {
        for (const component of this.tagComponentMap.values()) {
            this.registry.removeEntityComponent(this, component.clazz, options);
        }
    }

    findComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
    ): C | undefined {
        const tag = this.registry.lookup(clazzOrTag).tag;
        return this.tagComponentMap.get(tag) as C;
    }

    getComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
    ): C {
        const component = this.findComponent(clazzOrTag);
        assert(component !== undefined,
            'Component does not exist on entity', clazzOrTag, this);
        return component;
    }

    getComponents(): Iterable<Component<any>> {
        return Array.from(this.tagComponentMap.values());
    }

    hasComponent<C extends Component<C>>(clazz: ComponentClassType<C>): boolean {
        const component = this.findComponent(clazz);
        return component !== undefined;
    }

    destroy(): void {
        this.registry.destroyEntity(this);
    }
}
