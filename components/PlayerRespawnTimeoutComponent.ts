import { Component } from '@/ecs/Component';

export interface PlayerRespawnTimeoutComponentData {
    value: number;
}

export class PlayerRespawnTimeoutComponent
    extends Component<PlayerRespawnTimeoutComponent>
    implements PlayerRespawnTimeoutComponentData {
    static TAG = 'PRT';

    value = 0;
}
