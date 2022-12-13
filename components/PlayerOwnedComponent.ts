import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerOwnedComponentData {
    playerId: string;
}

export class PlayerOwnedComponent extends Component
    implements PlayerOwnedComponentData {
    static TAG = 'PO';

    playerId = 'invalid';
}

registerComponent(PlayerOwnedComponent,
	createAssert<Partial<PlayerOwnedComponentData>>());
