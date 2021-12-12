import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface PickupIgnoreComponentData {
    time: number;
    entityId: EntityId;
}

export class PickupIgnoreComponent
    extends Component<PickupIgnoreComponent>
    implements PickupIgnoreComponentData {
    time = 0;
    entityId = -1;
}
