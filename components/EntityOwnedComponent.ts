import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface EntityOwnedComponentData {
    id: EntityId;
}

export class EntityOwnedComponent
    extends Component<EntityOwnedComponent>
    implements EntityOwnedComponentData {
    static TAG = 'EO';

    id = -1;
}
