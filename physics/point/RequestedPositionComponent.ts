import { Component } from '@/ecs/Component';
import { Point } from './Point';

export interface RequestedPositionComponentData extends Point {}

export class RequestedPositionComponent
    extends Component<RequestedPositionComponent>
    implements RequestedPositionComponentData {
    x = 0;
    y = 0;
}
