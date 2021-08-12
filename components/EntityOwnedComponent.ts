import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface EntityOwnedComponentData {
    entityId: EntityId;
}

export class EntityOwnedComponent
    extends Component<EntityOwnedComponent>
    implements EntityOwnedComponentData {
    entityId = -1;
}
