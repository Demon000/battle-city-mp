import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { Point } from '@/physics/point/Point';

export interface RelativePositionComponentData extends Point {
    entityId: EntityId;
}

export class RelativePositionComponent
    extends Component<RelativePositionComponent>
    implements RelativePositionComponentData {
    static TAG = 'REP';

    x = 0;
    y = 0;
    entityId = 'invalid';
}
