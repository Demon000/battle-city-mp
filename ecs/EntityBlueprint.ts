import { Config } from '@/config/Config';
import { ComponentFlags } from './Component';
import { Entity } from './Entity';
import { RegistryOperationOptions } from './Registry';

export interface BlueprintData {
    components?: Record<string, any>,
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

    private addCommonComponents(
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
                this.addCommonComponents(extendedType, entity, options);
            }
        }

        if (blueprintData.components !== undefined) {
            entity.upsertComponents(blueprintData.components, options);
        }
    }

    private addEnvComponents(
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
                this.addEnvComponents(extendedType, entity);
            }
        }

        if (this.env === BlueprintEnv.CLIENT
            && blueprintData.clientComponents !== undefined) {
            entity.upsertComponents(blueprintData.clientComponents, options);
        } else if (this.env === BlueprintEnv.SERVER
            && blueprintData.serverComponents !== undefined) {
            entity.upsertComponents(blueprintData.serverComponents, {
                ...options,
                flags: ComponentFlags.SERVER_ONLY,
            });
        }
    }

    addComponents(
        type: string,
        entity: Entity,
        options?: RegistryOperationOptions,
    ): void {
        this.addCommonComponents(type, entity, options);
        this.addEnvComponents(type, entity, options);
    }
}
