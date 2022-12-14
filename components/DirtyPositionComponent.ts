import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirtyPositionComponentData {}

export class DirtyPositionComponent extends Component
    implements DirtyPositionComponentData {
    static TAG = 'DP';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DirtyPositionComponent,
    createAssert<Partial<DirtyPositionComponentData>>());
