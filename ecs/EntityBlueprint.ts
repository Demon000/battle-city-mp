import { Config } from '@/config/Config';
import { ComponentFlags } from './Component';
import { Entity } from './Entity';
import { RegistryOperationOptions } from './Registry';

export interface BlueprintData {
    components?: Record<string, any>,
    localComponents?: Record<string, any>,
    clientComponents?: Record<string, any>,
    serverComponents?: Record<string, any>,
    extends?: string[],
}

export enum BlueprintEnv {
    CLIENT,
    SERVER,
}

export class EntityBlueprint {
    constructor(
        private config: Config,
        private env: BlueprintEnv,
    ) {}

    addComponents(
        type: string,
        entity: Entity,
        options?: RegistryOperationOptions,
    ): void {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return;
        }

        if (blueprintData.extends !== undefined) {
            for (const extendedType of blueprintData.extends) {
                this.addComponents(extendedType, entity, options);
            }
        }

        if (blueprintData.components !== undefined) {
            entity.upsertComponents(blueprintData.components, options);
        }

        if (blueprintData.localComponents !== undefined) {
            entity.upsertComponents(blueprintData.localComponents, options);
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
