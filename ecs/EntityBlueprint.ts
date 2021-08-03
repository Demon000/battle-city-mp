import { ComponentRegistry } from './ComponentRegistry';
import { Config } from '@/config/Config';
import { ComponentClassType } from './Component';

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

    getComponents(type: string): [ComponentClassType<any>, any][] | undefined {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return undefined;
        }

        const components = [];
        if (blueprintData.components !== undefined) {
            components.push(...this.getComponentsFromData(blueprintData.components));
        }

        if (this.env === BlueprintEnv.CLIENT
            && blueprintData.clientComponents !== undefined) {
            components.push(...this.getComponentsFromData(blueprintData.clientComponents));
        }

        if (this.env === BlueprintEnv.SERVER
            && blueprintData.serverComponents !== undefined) {
            components.push(...this.getComponentsFromData(blueprintData.serverComponents));
        }

        return components;
    }
}
