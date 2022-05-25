import { Config } from '@/config/Config';
import { assert } from '@/utils/assert';
import { Component, ComponentFlags } from './Component';
import { Entity } from './Entity';
import { Registry, RegistryOperationOptions } from './Registry';

export interface BlueprintComponentsData {
    components?: Record<string, any>,
    localComponents?: Record<string, any>,
    clientComponents?: Record<string, any>,
    serverComponents?: Record<string, any>,
    sharedLocalComponents?: Record<string, any>,
    sharedClientComponents?: Record<string, any>,
    sharedServerComponents?: Record<string, any>,
}

export interface BlueprintData extends BlueprintComponentsData {
    extends?: string[],
}

export type BlueprintComponentsKeys = keyof BlueprintComponentsData;
export type BlueprintsData = Record<string, BlueprintData>;

export enum BlueprintEnv {
    CLIENT,
    SERVER,
}

export class EntityBlueprint {
    private blueprintsData?: BlueprintsData;
    private blueprintComponentsKeys: BlueprintComponentsKeys[] = [
        'components',
        'localComponents',
        'sharedLocalComponents',
    ];
    private ignoredKeys: BlueprintComponentsKeys[] = [];

    constructor(
        private registry: Registry,
        private config: Config,
        private env: BlueprintEnv,
    ) {
        if (this.env === BlueprintEnv.CLIENT) {
            this.blueprintComponentsKeys.push('clientComponents');
            this.blueprintComponentsKeys.push('sharedClientComponents');
            this.ignoredKeys.push('serverComponents');
            this.ignoredKeys.push('sharedServerComponents');
        } else if (this.env === BlueprintEnv.SERVER) {
            this.blueprintComponentsKeys.push('serverComponents');
            this.blueprintComponentsKeys.push('sharedServerComponents');
            this.ignoredKeys.push('clientComponents');
            this.ignoredKeys.push('sharedClientComponents');
        }
    }

    private addBlueprintData(
        type: string,
        target: BlueprintData,
        firstLevel = false,
    ) {
        assert(this.blueprintsData !== undefined,
            'Blueprints data is missing');

        const blueprintData = this.blueprintsData[type];
        assert(blueprintData !== undefined,
            `Blueprint data for '${type}' does not exist`);

        if (blueprintData.extends !== undefined) {
            for (const extendedType of blueprintData.extends) {
                this.addBlueprintData(extendedType, target);
            }

            delete blueprintData.extends;
        }

        for (const key of this.ignoredKeys) {
            delete blueprintData[key];
        }

        if (firstLevel) {
            return;
        }

        for (const key of this.blueprintComponentsKeys) {
            const blueprintComponentsData = blueprintData[key];
            if (blueprintComponentsData === undefined) {
                continue;
            }

            let targetComponentsData = target[key];
            if (targetComponentsData === undefined) {
                target[key] = targetComponentsData = {};
            }

            for (const tag of Object.keys(blueprintComponentsData)) {
                targetComponentsData[tag] = Object.assign({},
                    blueprintComponentsData[tag],
                    targetComponentsData[tag]);
            }
        }
    }

    reloadBlueprintData(): void {
        const data = this.config.getData('entities-blueprint');
        this.blueprintsData = JSON.parse(JSON.stringify(data)) as BlueprintsData;

        for (const [type, blueprintData] of Object.entries(this.blueprintsData)) {
            this.addBlueprintData(type, blueprintData, true);
        }
    }

    findTypeComponentData(type: string, tag: string): any {
        assert(this.blueprintsData !== undefined,
            'Blueprints data is missing');

        const blueprintData = this.blueprintsData[type];
        assert(blueprintData !== undefined,
            `Blueprint data for '${type}' does not exist`);

        for (const key of this.blueprintComponentsKeys) {
            const componentsInitialization = blueprintData[key];
            if (componentsInitialization === undefined) {
                continue;
            }

            const componentData = componentsInitialization[tag];
            if (componentData === undefined) {
                continue;
            }

            return componentData;
        }

        return undefined;
    }

    getTypeComponentData(type: string, tag: string): any {
        const componentData = this.findTypeComponentData(type, tag);

        assert(componentData !== undefined,
            `Blueprint data for '${type}' and component '${tag}' does not exist`);

        return componentData;
    }

    addLocalComponents(
        entity: Entity,
        components: Record<string, any> | undefined,
        options?: RegistryOperationOptions,
    ): void {
        if (components === undefined) {
            return;
        }

        entity.upsertComponents(components, {
            ...options,
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    addSharedComponents(
        entity: Entity,
        components: Record<string, any> | undefined,
        options?: RegistryOperationOptions,
    ): void {
        if (components === undefined) {
            return;
        }

        for (const [tag, data] of Object.entries(components)) {
            const clazz = this.registry.lookup(tag);
            let component: Component<any>;

            if (clazz.BASE_FLAGS & ComponentFlags.SHARED) {
                component = this.registry.findSharedComponent(clazz);
                if (component === undefined) {
                    component = this.registry
                        .createDetachedComponent(tag, undefined, {
                            ...options,
                            flags: ComponentFlags.LOCAL_ONLY,
                        });
                    this.registry.addSharedComponent(component);
                }
            } else {
                component = this.registry.findSharedByTypeComponent(entity.type,
                    clazz);
                if (component === undefined) {
                    component = this.registry
                        .createDetachedComponent(tag, data, {
                            ...options,
                            flags: ComponentFlags.LOCAL_ONLY
                                | ComponentFlags.SHARED_BY_TYPE,
                        });
                    this.registry.addSharedByTypeComponent(entity.type, component);
                }
            }

            entity.attachComponent(component, options);
        }
    }

    addComponents(
        type: string,
        entity: Entity,
        options?: RegistryOperationOptions,
    ): void {
        assert(this.blueprintsData !== undefined,
            'Blueprints data is missing');

        const blueprintData = this.blueprintsData[type];
        assert(blueprintData !== undefined,
            `Blueprint data for '${type}' does not exist`);

        if (blueprintData.components !== undefined) {
            entity.upsertComponents(blueprintData.components, options);
        }

        this.addLocalComponents(entity, blueprintData.localComponents, options);
        this.addSharedComponents(entity, blueprintData.sharedLocalComponents, options);

        if (this.env === BlueprintEnv.CLIENT) {
            this.addLocalComponents(entity, blueprintData.clientComponents, options);
        } else if (this.env === BlueprintEnv.SERVER) {
            this.addLocalComponents(entity, blueprintData.serverComponents, options);
        }

        if (this.env === BlueprintEnv.CLIENT) {
            this.addSharedComponents(entity, blueprintData.sharedClientComponents, options);
        } else if (this.env === BlueprintEnv.SERVER) {
            this.addSharedComponents(entity, blueprintData.sharedServerComponents, options);
        }
    }
}
