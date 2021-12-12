import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { Point } from './Point';

export interface RelativePositionComponentData extends Point {
    entityId: EntityId;
}

export class RelativePositionComponent
    extends Component<RelativePositionComponent>
    implements RelativePositionComponentData {
    x = 0;
    y = 0;
    entityId: EntityId = -1;
}
