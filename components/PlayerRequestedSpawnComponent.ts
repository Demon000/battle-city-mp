import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerRequestedSpawnComponentData {}

export class PlayerRequestedSpawnComponent extends Component
    implements PlayerRequestedSpawnComponentData {
    static TAG = 'PRS';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(PlayerRequestedSpawnComponent,
    createAssert<Partial<PlayerRequestedSpawnComponentData>>());
