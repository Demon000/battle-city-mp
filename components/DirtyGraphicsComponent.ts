import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirtyGraphicsComponentData {}

export class DirtyGraphicsComponent extends Component
    implements DirtyGraphicsComponentData {
    static TAG = 'DG';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DirtyGraphicsComponent,
	createAssert<Partial<DirtyGraphicsComponentData>>());
