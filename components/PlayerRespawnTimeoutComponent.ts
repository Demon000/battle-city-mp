import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerRespawnTimeoutComponentData {
    value: number;
}

export class PlayerRespawnTimeoutComponent extends Component
    implements PlayerRespawnTimeoutComponentData {
    static TAG = 'PRT';

    value = 0;
}

registerComponent(PlayerRespawnTimeoutComponent,
    createAssert<Partial<PlayerRespawnTimeoutComponentData>>());
