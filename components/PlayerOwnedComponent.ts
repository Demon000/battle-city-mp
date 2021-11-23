import { Component } from '@/ecs/Component';

export interface PlayerOwnedComponentData {
    playerId: string;
    playerName?: string;
}

export class PlayerOwnedComponent
    extends Component<PlayerOwnedComponent>
    implements PlayerOwnedComponentData {
    playerId = 'invalid';
    playerName?: string;
}
