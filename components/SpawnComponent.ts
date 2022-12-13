import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface SpawnComponentData {}

export class SpawnComponent extends Component
    implements SpawnComponentData {
    static TAG = 'SP';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(SpawnComponent,
	createAssert<Partial<SpawnComponentData>>());
