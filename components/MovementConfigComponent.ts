import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface MovementConfigComponentData {
    maxSpeed: number;
    accelerationFactor: number;
    decelerationFactor: number;
}

export class MovementConfigComponent extends Component
    implements MovementConfigComponentData {
    static TAG = 'MC';

    maxSpeed = 0;
    accelerationFactor = 0;
    decelerationFactor = 0;
}

registerComponent(MovementConfigComponent,
    createAssert<Partial<MovementConfigComponentData>>());
