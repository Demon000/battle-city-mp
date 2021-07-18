import { ComponentRegistry } from './ComponentRegistry';
import { Config } from '@/config/Config';
import { ComponentClassType } from './Component';

export interface BlueprintData {
    components: Record<string, any>,
    extends?: string[],
}

export class EntityBlueprint {
    constructor(
        private config: Config,
        private componentRegistry: ComponentRegistry,
    ) {}

    getComponents(type: string): [ComponentClassType<any>, any][] | undefined {
        const blueprintData = this.config.find<BlueprintData>('entities-blueprint', type);
        if (blueprintData === undefined) {
            return undefined;
        }

        return Object.entries(blueprintData.components).map(
            ([tag, data]) => [this.componentRegistry.getComponentClassByTag(tag), data],
        );
    }
}
