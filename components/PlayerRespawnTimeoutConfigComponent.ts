import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerRespawnTimeoutConfigComponentData {
    value: number;
}

export class PlayerRespawnTimeoutConfigComponent extends Component
    implements PlayerRespawnTimeoutConfigComponentData {
    static TAG = 'PRTC';

    value = 0;
}

registerComponent(PlayerRespawnTimeoutConfigComponent,
    createAssert<Partial<PlayerRespawnTimeoutConfigComponentData>>());
