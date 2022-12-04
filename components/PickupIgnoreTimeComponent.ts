import { Component } from '@/ecs/Component';

export interface PickupIgnoreTimeComponentData {
    value: number;
}

export class PickupIgnoreTimeComponent
    extends Component<PickupIgnoreTimeComponent>
    implements PickupIgnoreTimeComponentData {
    static TAG = 'PIT';

    value = 0;
}
