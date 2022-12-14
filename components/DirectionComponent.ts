import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface DirectionComponentData {
    value: Direction;
}

export class DirectionComponent extends Component
    implements DirectionComponentData {
    static TAG = 'DI';

    value = Direction.UP;
}

registerComponent(DirectionComponent,
    createAssert<Partial<DirectionComponentData>>());
