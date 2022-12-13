import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface EntitiesOwnerComponentData {
    ids: Record<string, boolean>;
}

export class EntitiesOwnerComponent extends Component
    implements EntitiesOwnerComponentData {
    static TAG = 'EOR';

    ids: Record<string, boolean> = {};
}

registerComponent(EntitiesOwnerComponent,
	createAssert<Partial<EntitiesOwnerComponentData>>());
