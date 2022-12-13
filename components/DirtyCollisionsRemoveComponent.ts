import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirtyCollisionsRemoveComponentData {}

export class DirtyCollisionsRemoveComponent extends Component
    implements DirtyCollisionsRemoveComponentData {
    static TAG = 'DCR';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DirtyCollisionsRemoveComponent,
	createAssert<Partial<DirtyCollisionsRemoveComponentData>>());
