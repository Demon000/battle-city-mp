import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface RoundTimeComponentData {
    value: number;
}

export class RoundTimeComponent extends Component
    implements RoundTimeComponentData {
    static TAG = 'RT';

    value = 0;
}

registerComponent(RoundTimeComponent,
	createAssert<Partial<RoundTimeComponentData>>());
