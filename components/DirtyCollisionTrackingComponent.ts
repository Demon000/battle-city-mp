import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirtyCollisionTrackingComponentData {}

export class DirtyCollisionTrackingComponent extends Component
    implements DirtyCollisionTrackingComponentData {
    static TAG = 'DCT';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DirtyCollisionTrackingComponent,
    createAssert<Partial<DirtyCollisionTrackingComponentData>>());
