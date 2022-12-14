import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface IsMovingComponentData {}

export class IsMovingComponent extends Component
    implements IsMovingComponentData {
    static TAG = 'IM';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(IsMovingComponent,
    createAssert<Partial<IsMovingComponentData>>());
