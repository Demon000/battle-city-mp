import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirtyCollisionsUpdateComponentData {}

export class DirtyCollisionsUpdateComponent extends Component
    implements DirtyCollisionsUpdateComponentData {
    static TAG = 'DCU';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DirtyCollisionsUpdateComponent,
	createAssert<Partial<DirtyCollisionsUpdateComponentData>>());
