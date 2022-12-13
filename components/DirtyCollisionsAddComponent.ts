import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirtyCollisionsAddComponentData {}

export class DirtyCollisionsAddComponent extends Component
    implements DirtyCollisionsAddComponentData {
    static TAG = 'DCA';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DirtyCollisionsAddComponent,
	createAssert<Partial<DirtyCollisionsAddComponentData>>());
