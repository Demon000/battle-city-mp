import { ComponentRegistry } from './ComponentRegistry';
import { Config } from '@/config/Config';
import { ComponentClassType } from './Component';
import { assert } from '@/utils/assert';

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
        private componentRegistry: ComponentRegistry,
        private env: BlueprintEnv,
    ) {}

    private getComponentsFromData(
        data: Record<string, any>,
    ): [ComponentClassType<any>, any][] {
        return Object.entries(data).map(
            ([tag, data]) => [this.componentRegistry.getComponentClassByTag(tag), data],
        );
    }

    getCommonComponents(type: string): [ComponentClassType<any>, any][] | undefined {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return undefined;
        }

        if (blueprintData.components !== undefined) {
            return this.getComponentsFromData(blueprintData.components);
        }
    }

    getEnv(): BlueprintEnv {
        return this.env;
    }

    getEnvComponents(type: string): [ComponentClassType<any>, any][] | undefined {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return undefined;
        }

        if (this.env === BlueprintEnv.CLIENT
            && blueprintData.clientComponents !== undefined) {
            return this.getComponentsFromData(blueprintData.clientComponents);
        } else if (this.env === BlueprintEnv.SERVER
            && blueprintData.serverComponents !== undefined) {
            return this.getComponentsFromData(blueprintData.serverComponents);
        }

        assert(false);
    }
}
