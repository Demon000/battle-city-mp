import { assert } from '@/utils/assert';
import { ClazzOrTag, Component, ComponentClassType, ComponentsInitialization } from './Component';
import { EntityId } from './EntityId';
import { ComponentEmitOptions, Registry, RegistryComponentEvent, RegistryOperationOptions } from './Registry';

export interface EntityComponentsOptions {
    withFlags?: number;
    withoutFlags?: number;
}

export class Entity {
    private tagComponentMap = new Map<ComponentClassType, Component<any>>();

    constructor(
        private registry: Registry,
        public id: EntityId,
        public type: string,
        public subtypes?: string[],
    ) {}

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
        clazzOrTag: ClazzOrTag,
        data?: any,
        options?: RegistryOperationOptions,
    ): C {
        return this.registry.addComponent(this, clazzOrTag, data, options);
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
        for (const [clazz, component] of this.tagComponentMap) {
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
            componentsInitialization[clazz.tag] = component.getData();
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
        return this.registry.removeComponent(component, options);
    }

    removeComponentIfExists<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
        options?: RegistryOperationOptions,
    ): C | undefined {
        const component = this.getComponent(clazzOrTag);
        return this.registry.removeComponentIfExists(component, options);
    }

    removeComponents(options?: RegistryOperationOptions): void {
        for (const component of this.tagComponentMap.values()) {
            this.registry.removeComponent(component, options);
        }
    }

    emitForEachComponent(
        event: RegistryComponentEvent,
        options?: ComponentEmitOptions,
    ): void {
        for (const component of this.tagComponentMap.values()) {
            this.registry.emit(event, component, component.getData(), options);
        }
    }

    findComponent<
        C extends Component<C>,
    >(
        clazzOrTag: ClazzOrTag<C>,
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
        clazzOrTag: ClazzOrTag<C>,
    ): C {
        const component = this.findComponent(clazzOrTag);
        assert(component !== undefined,
            'Component does not exist on entity', clazzOrTag, this);
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
