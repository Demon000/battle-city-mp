import { Component } from '@/ecs/Component';

export interface PickupIgnoreTimeComponentData {
    value: number;
}

export class PickupIgnoreTimeComponent extends Component
    implements PickupIgnoreTimeComponentData {
    static TAG = 'PIT';

    value = 0;
}
