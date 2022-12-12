import { Component, ComponentFlags } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';

export interface RequestedDirectionComponentData {
    value: Direction;
}

export class RequestedDirectionComponent extends Component
    implements RequestedDirectionComponentData {
    static TAG = 'RD';
    static BASE_FLAGS = ComponentFlags.LOCAL_ONLY;

    value = Direction.UP;
}
