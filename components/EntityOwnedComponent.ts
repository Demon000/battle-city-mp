import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface EntityOwnedComponentData {
    id: EntityId;
}

export class EntityOwnedComponent extends Component
    implements EntityOwnedComponentData {
    static TAG = 'EO';

    id = 'invalid';
}

registerComponent(EntityOwnedComponent,
    createAssert<Partial<EntityOwnedComponentData>>());
