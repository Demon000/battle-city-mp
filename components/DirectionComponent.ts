import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';

export interface DirectionComponentData {
    value: Direction;
}

export class DirectionComponent
    extends Component<DirectionComponent>
    implements DirectionComponentData {
    static TAG = 'DI';

    value = Direction.UP;
}