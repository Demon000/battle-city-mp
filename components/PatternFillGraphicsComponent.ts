import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PatternFillGraphicsComponentData {}

export class PatternFillGraphicsComponent extends Component
    implements PatternFillGraphicsComponentData {
    static TAG = 'PFG';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(PatternFillGraphicsComponent,
    createAssert<Partial<PatternFillGraphicsComponentData>>());
