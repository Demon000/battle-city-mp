import { Component } from '@/ecs/Component';

export interface PlayerOwnedComponentData {
    playerId: string;
    playerName?: string;
}

export class PlayerOwnedComponent
    extends Component<PlayerOwnedComponent>
    implements PlayerOwnedComponentData {
    static TAG = 'PO';

    playerId = 'invalid';
    playerName?: string;
}
