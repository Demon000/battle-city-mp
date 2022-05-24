import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface CollisionTrackingComponentData {
    values: Record<string, EntityId | false>;
}

export class CollisionTrackingComponent
    extends Component<CollisionTrackingComponent>
    implements CollisionTrackingComponentData {
    static TAG = 'CT';

    values: Record<string, EntityId | false> = {};
}
