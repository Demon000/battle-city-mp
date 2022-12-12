import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface EntityOwnedComponentData {
    id: EntityId;
}

export class EntityOwnedComponent extends Component
    implements EntityOwnedComponentData {
    static TAG = 'EO';

    id = 'invalid';
}
