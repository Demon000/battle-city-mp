import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PickupIgnoreTimeComponentData {
    value: number;
}

export class PickupIgnoreTimeComponent extends Component
    implements PickupIgnoreTimeComponentData {
    static TAG = 'PIT';

    value = 0;
}

registerComponent(PickupIgnoreTimeComponent,
    createAssert<Partial<PickupIgnoreTimeComponentData>>());
