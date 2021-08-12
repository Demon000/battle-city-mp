import { Component } from '@/ecs/Component';

export interface PlayerOwnedComponentData {
    playerId: string;
}

export class PlayerOwnedComponent
    extends Component<PlayerOwnedComponent>
    implements PlayerOwnedComponentData {
    playerId = 'invalid';
}
