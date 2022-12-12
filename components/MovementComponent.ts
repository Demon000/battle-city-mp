import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';

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
