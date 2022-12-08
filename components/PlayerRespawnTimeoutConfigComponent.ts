import { Component, ComponentFlags } from '@/ecs/Component';

export interface PlayerRespawnTimeoutConfigComponentData {
    value: number;
}

export class PlayerRespawnTimeoutConfigComponent
    extends Component<PlayerRespawnTimeoutConfigComponent>
    implements PlayerRespawnTimeoutConfigComponentData {
    static TAG = 'PRTC';

    value = 0;
}
