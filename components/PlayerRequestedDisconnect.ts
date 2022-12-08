import { Component, ComponentFlags } from '@/ecs/Component';

export interface PlayerRequestedDisconnectComponentData {}

export class PlayerRequestedDisconnectComponent
    extends Component<PlayerRequestedDisconnectComponent>
    implements PlayerRequestedDisconnectComponentData {
    static TAG = 'PRD';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
