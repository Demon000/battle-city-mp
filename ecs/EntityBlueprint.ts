import { Config } from '@/config/Config';
import { assert } from '@/utils/assert';
import { ComponentFlags } from './Component';
import { Entity } from './Entity';
import { RegistryOperationOptions } from './Registry';

export interface BlueprintComponentsData {
    components?: Record<string, any>,
    localComponents?: Record<string, any>,
    clientComponents?: Record<string, any>,
    serverComponents?: Record<string, any>,
}

export interface BlueprintData extends BlueprintComponentsData {
    extends?: string[],
}

export type BlueprintComponentsKeys = keyof BlueprintComponentsData;
export const blueprintComponentsKeys: BlueprintComponentsKeys[] = [
    'components',
    'localComponents',
    'clientComponents',
    'serverComponents',
];

export type BlueprintsData = Record<string, BlueprintData>;

export enum BlueprintEnv {
    CLIENT,
    SERVER,
}

export class EntityBlueprint {
    private blueprintsData?: BlueprintsData;

    constructor(
        private config: Config,
        private env: BlueprintEnv,
    ) {}

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

        if (firstLevel) {
            return;
        }

        for (const key of blueprintComponentsKeys) {
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

        for (const key of blueprintComponentsKeys) {
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

        if (blueprintData.localComponents !== undefined) {
            entity.upsertComponents(blueprintData.localComponents, {
                ...options,
                flags: ComponentFlags.LOCAL_ONLY,
            });
        }

        let components;
        if (this.env === BlueprintEnv.CLIENT) {
            components = blueprintData.clientComponents;
        } else if (this.env === BlueprintEnv.SERVER) {
            components = blueprintData.serverComponents;
        }

        if (components !== undefined) {
            entity.upsertComponents(components, {
                ...options,
                flags: ComponentFlags.LOCAL_ONLY,
            });
        }
    }
}
