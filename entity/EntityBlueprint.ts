import ComponentRegistry from '@/components/ComponentRegistry';
import { ComponentClassType } from '@/ecs/Component';
import { assert } from '@/utils/assert';
import { EntityType } from './EntityType';

export default class EntityBlueprint {
    constructor(
        private componentRegistry: ComponentRegistry,
        private typesBlueprintDataMap: Record<string, Record<string, any>>,
    ) {}

    getComponents(type: EntityType): [ComponentClassType<any>, any][] {
        const blueprintData = this.typesBlueprintDataMap[type];
        assert(blueprintData);
        return Object.entries(blueprintData).map(
            ([tag, data]) => [this.componentRegistry.getComponentClassByTag(tag), data]
        );
    }
}
