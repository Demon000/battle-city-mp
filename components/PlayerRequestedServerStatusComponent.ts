import { Component, ComponentFlags } from '@/ecs/Component';

export interface PlayerRequestedServerStatusComponentData {}

export class PlayerRequestedServerStatusComponent
    extends Component<PlayerRequestedServerStatusComponent>
    implements PlayerRequestedServerStatusComponentData {
    static TAG = 'PRSS';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
