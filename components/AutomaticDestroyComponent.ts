import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface AutomaticDestroyComponentData {
    timeMs: number;
}

export class AutomaticDestroyComponent extends Component
    implements AutomaticDestroyComponentData {
    static TAG = 'AD';

    timeMs = 0;
}

registerComponent(AutomaticDestroyComponent,
    createAssert<Partial<AutomaticDestroyComponentData>>());
