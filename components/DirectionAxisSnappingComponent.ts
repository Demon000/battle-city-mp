import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirectionAxisSnappingComponentData {
    readonly value: number;
}

export class DirectionAxisSnappingComponent extends Component
    implements DirectionAxisSnappingComponentData {
    static TAG = 'DAS';

    value = 0;
}

registerComponent(DirectionAxisSnappingComponent,
	createAssert<Partial<DirectionAxisSnappingComponentData>>());
