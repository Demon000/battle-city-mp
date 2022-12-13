import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface WorldEntityComponentData {}

export class WorldEntityComponent extends Component
    implements WorldEntityComponentData {
    static TAG = 'WE';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(WorldEntityComponent,
	createAssert<Partial<WorldEntityComponentData>>());
