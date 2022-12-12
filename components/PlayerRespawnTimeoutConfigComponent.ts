import { Component } from '@/ecs/Component';

export interface PlayerRespawnTimeoutConfigComponentData {
    value: number;
}

export class PlayerRespawnTimeoutConfigComponent extends Component
    implements PlayerRespawnTimeoutConfigComponentData {
    static TAG = 'PRTC';

    value = 0;
}
