import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';

export interface MovementComponentData {
    speed: number;
    maxSpeed: number;
    direction: Direction | null;
    accelerationFactor: number;
    decelerationFactor: number;
}

export class MovementComponent
    extends Component<MovementComponent>
    implements MovementComponentData {
    static TAG = 'M';

    speed = 0;
    maxSpeed = 0;
    direction = null;
    accelerationFactor = 0;
    decelerationFactor = 0;
}
