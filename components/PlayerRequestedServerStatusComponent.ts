import { Component, ComponentFlags } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerRequestedServerStatusComponentData {}

export class PlayerRequestedServerStatusComponent extends Component
    implements PlayerRequestedServerStatusComponentData {
    static TAG = 'PRSS';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}

registerComponent(PlayerRequestedServerStatusComponent,
    createAssert<Partial<PlayerRequestedServerStatusComponentData>>());
