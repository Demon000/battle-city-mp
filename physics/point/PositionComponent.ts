import { Component } from '@/ecs/Component';
import Point from './Point';

export interface PositionComponentData {
    value: Point;
}

export default class PositionComponent
    extends Component<PositionComponent>
    implements PositionComponentData {
    value: Point = { x: 0, y: 0 };
}
