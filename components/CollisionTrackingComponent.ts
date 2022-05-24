import { Component } from '@/ecs/Component';

export interface CollisionTrackingComponentData {
    values: Record<string, boolean>;
}

export class CollisionTrackingComponent
    extends Component<CollisionTrackingComponent>
    implements CollisionTrackingComponentData {
    static TAG = 'CT';

    values: Record<string, boolean> = {};
}
