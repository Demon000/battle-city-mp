import { Component } from '@/ecs/Component';
import { Direction } from './Direction';

export interface RequestedDirectionComponentData {
    value: Direction;
}

export class RequestedDirectionComponent
    extends Component<RequestedDirectionComponent>
    implements RequestedDirectionComponentData {
    value = Direction.UP;
}
