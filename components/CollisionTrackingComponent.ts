import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export type CollisionTrackingData = Record<string, Record<EntityId, boolean>>;

export interface CollisionTrackingComponentData {
    values: CollisionTrackingData;
}

export class CollisionTrackingComponent
    extends Component<CollisionTrackingComponent>
    implements CollisionTrackingComponentData {
    static TAG = 'CT';

    values: CollisionTrackingData = {};
}
