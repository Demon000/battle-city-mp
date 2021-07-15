import { ComponentRegistry } from '@/components/ComponentRegistry';
import { Config } from '@/config/Config';
import { ComponentClassType } from '@/ecs/Component';
import { assert } from '@/utils/assert';

export interface BlueprintData {
    components: Record<string, any>,
    extends?: string[],
}

export class EntityBlueprint {
    constructor(
        private config: Config,
        private componentRegistry: ComponentRegistry,
    ) {}

    getComponents(type: string): [ComponentClassType<any>, any][] {
        const blueprintData = this.config.get<BlueprintData>('entities-blueprint', type);
        assert(blueprintData);
        return Object.entries(blueprintData.components).map(
            ([tag, data]) => [this.componentRegistry.getComponentClassByTag(tag), data],
        );
    }
}
