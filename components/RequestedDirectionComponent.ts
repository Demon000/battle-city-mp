import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';

export interface RequestedDirectionComponentData {
    value: Direction;
}

export class RequestedDirectionComponent
    extends Component<RequestedDirectionComponent>
    implements RequestedDirectionComponentData {
    static TAG = 'RD';

    value = Direction.UP;
}