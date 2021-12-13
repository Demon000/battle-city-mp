import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';

export interface CenterPositionComponentData extends Point {}

export class CenterPositionComponent
    extends Component<CenterPositionComponent>
    implements CenterPositionComponentData {
    x = 0;
    y = 0;
}
