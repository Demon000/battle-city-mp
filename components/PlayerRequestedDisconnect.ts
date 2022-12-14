import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerRequestedDisconnectComponentData {}

export class PlayerRequestedDisconnectComponent extends Component
    implements PlayerRequestedDisconnectComponentData {
    static TAG = 'PRD';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(PlayerRequestedDisconnectComponent,
    createAssert<Partial<PlayerRequestedDisconnectComponentData>>());
