import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DynamicSizeComponentData {}

export class DynamicSizeComponent extends Component
    implements DynamicSizeComponentData {
    static TAG = 'DS';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(DynamicSizeComponent,
    createAssert<Partial<DynamicSizeComponentData>>());
