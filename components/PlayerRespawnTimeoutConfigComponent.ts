import { Component, ComponentFlags } from '@/ecs/Component';

export interface PlayerRespawnTimeoutConfigComponentData {
    value: number;
}

export class PlayerRespawnTimeoutConfigComponent
    extends Component<PlayerRespawnTimeoutConfigComponent>
    implements PlayerRespawnTimeoutConfigComponentData {
    static TAG = 'PRTC';
    // TODO: allow state for shared components
    static BASE_FLAGS = ComponentFlags.LOCAL_ONLY;

    value = 0;
}
