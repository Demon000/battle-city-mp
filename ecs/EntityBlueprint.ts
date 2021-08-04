import { Config } from '@/config/Config';
import { ComponentFlags } from './Component';
import { Entity } from './Entity';

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

    private addComponentsFromData(
        rawData: Record<string, any>,
        entity: Entity,
        flags?: number,
    ): void {
        for (const [tag, data] of  Object.entries(rawData)) {
            entity.addComponent(tag, data, {
                flags,
            });
        }
    }

    private addCommonComponents(
        type: string,
        entity: Entity,
    ): void {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return;
        }

        if (blueprintData.extends !== undefined) {
            for (const extendedType of  blueprintData.extends) {
                this.addCommonComponents(extendedType, entity);
            }
        }

        if (blueprintData.components !== undefined) {
            this.addComponentsFromData(blueprintData.components, entity);
        }
    }

    private addEnvComponents(
        type: string,
        entity: Entity,
    ): void {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return;
        }

        if (blueprintData.extends !== undefined) {
            for (const extendedType of  blueprintData.extends) {
                this.addEnvComponents(extendedType, entity);
            }
        }

        if (this.env === BlueprintEnv.CLIENT
            && blueprintData.clientComponents !== undefined) {
            this.addComponentsFromData(blueprintData.clientComponents, entity);
        } else if (this.env === BlueprintEnv.SERVER
            && blueprintData.serverComponents !== undefined) {
            this.addComponentsFromData(blueprintData.serverComponents, entity,
                ComponentFlags.SERVER_ONLY);
        }
    }

    addComponents(type: string, entity: Entity): void {
        this.addCommonComponents(type, entity);
        this.addEnvComponents(type, entity);
    }
}
