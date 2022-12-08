import { Component, ComponentFlags } from '@/ecs/Component';

export interface PlayerRequestedSpawnComponentData {}

export class PlayerRequestedSpawnComponent
    extends Component<PlayerRequestedSpawnComponent>
    implements PlayerRequestedSpawnComponentData {
    static TAG = 'PRS';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
