import { Component } from '@/ecs/Component';
import { PlayerSpawnStatus } from './PlayerComponent';

export interface PlayerRequestedSpawnStatusComponentData {
    value: PlayerSpawnStatus;
}

export class PlayerRequestedSpawnStatusComponent
    extends Component<PlayerRequestedSpawnStatusComponent>
    implements PlayerRequestedSpawnStatusComponentData {
    static TAG = 'PRSPS';

    value = PlayerSpawnStatus.SPAWN;
}
