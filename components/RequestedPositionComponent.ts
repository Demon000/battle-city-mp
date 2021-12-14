import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';

export interface RequestedPositionComponentData extends Point {}

export class RequestedPositionComponent
    extends Component<RequestedPositionComponent>
    implements RequestedPositionComponentData {
    static TAG = 'RP';

    x = 0;
    y = 0;
}
