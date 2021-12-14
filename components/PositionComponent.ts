import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';

export interface PositionComponentData extends Point {}

export class PositionComponent
    extends Component<PositionComponent>
    implements PositionComponentData {
    static TAG = 'P';

    x = 0;
    y = 0;
}
