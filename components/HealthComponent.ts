import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface HealthComponentData {
    max: number;
    value: number;
}

export class HealthComponent extends Component
    implements HealthComponentData {
    static TAG = 'H';

    value = 0;
    max = 0;
}

registerComponent(HealthComponent,
	createAssert<Partial<HealthComponentData>>());
