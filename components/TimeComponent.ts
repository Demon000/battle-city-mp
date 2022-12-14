import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface TimeComponentData {
    value: number;
}

export class TimeComponent extends Component
    implements TimeComponentData {
    static TAG = 'TI';

    value = 0;
}

registerComponent(TimeComponent,
	createAssert<Partial<TimeComponentData>>());
