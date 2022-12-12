import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

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
