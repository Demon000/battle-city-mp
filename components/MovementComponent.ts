import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface MovementComponentData {
    speed: number;
    direction: Direction | null;
}

export class MovementComponent extends Component
    implements MovementComponentData {
    static TAG = 'M';

    speed = 0;
    direction = null;
}

registerComponent(MovementComponent,
    createAssert<Partial<MovementComponentData>>());
