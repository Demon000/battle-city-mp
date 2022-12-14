import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface FlagComponentData {
    sourceId: EntityId;
}

export class FlagComponent extends Component
    implements FlagComponentData {
    static TAG = 'F';

    sourceId = 'invalid';
}

registerComponent(FlagComponent,
    createAssert<Partial<FlagComponentData>>());
