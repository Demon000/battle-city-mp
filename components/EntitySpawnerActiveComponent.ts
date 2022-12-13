import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface EntitySpawnerActiveComponentData {
    tags: Record<string, boolean>;
}

export class EntitySpawnerActiveComponent extends Component
    implements EntitySpawnerActiveComponentData {
    tags: Record<string, boolean> = {};
    static TAG = 'ESA';
}

registerComponent(EntitySpawnerActiveComponent,
	createAssert<Partial<EntitySpawnerActiveComponentData>>());
