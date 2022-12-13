import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PositionComponentData extends Point {}

export class PositionComponent extends Component
    implements PositionComponentData {
    static TAG = 'P';

    x = 0;
    y = 0;
}

registerComponent(PositionComponent,
	createAssert<Partial<PositionComponentData>>());
