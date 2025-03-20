import { Component, ComponentFlags } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export type CollisionTrackingData = Record<string, Record<EntityId, boolean>>;
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface CollisionTrackingComponentData {
    values: CollisionTrackingData;
}

export class CollisionTrackingComponent extends Component
    implements CollisionTrackingComponentData {
    static TAG = 'CT';

    values: CollisionTrackingData = {};
    static BASE_FLAGS = ComponentFlags.LOCAL_ONLY;
}

registerComponent(CollisionTrackingComponent,
    createAssert<Partial<CollisionTrackingComponentData>>());
