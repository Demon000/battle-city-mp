import { Component } from '@/ecs/Component';
import { Point } from './Point';

export interface PositionComponentData extends Point {}

export class PositionComponent
    extends Component<PositionComponent>
    implements PositionComponentData {
    x = 0;
    y = 0;
}
