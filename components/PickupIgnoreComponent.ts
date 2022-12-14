import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PickupIgnoreComponentData {
    time: number;
    entityId: EntityId;
}

export class PickupIgnoreComponent extends Component
    implements PickupIgnoreComponentData {
    static TAG = 'PI';

    time = 0;
    entityId = 'invalid';
}

registerComponent(PickupIgnoreComponent,
    createAssert<Partial<PickupIgnoreComponentData>>());
