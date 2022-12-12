import { Component } from '@/ecs/Component';

export interface PlayerOwnedComponentData {
    playerId: string;
}

export class PlayerOwnedComponent extends Component
    implements PlayerOwnedComponentData {
    static TAG = 'PO';

    playerId = 'invalid';
}
