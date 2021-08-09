import { Component } from '@/ecs/Component';
import { Direction } from './Direction';

export interface DirectionComponentData {
    value: Direction;
}

export class DirectionComponent
    extends Component<DirectionComponent>
    implements DirectionComponentData {
    value = Direction.UP;
}