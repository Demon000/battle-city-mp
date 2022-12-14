import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { Point } from '@/physics/point/Point';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface RelativePositionComponentData extends Point {
    entityId: EntityId;
}

export class RelativePositionComponent extends Component
    implements RelativePositionComponentData {
    static TAG = 'REP';

    x = 0;
    y = 0;
    entityId = 'invalid';
}

registerComponent(RelativePositionComponent,
    createAssert<Partial<RelativePositionComponentData>>());
