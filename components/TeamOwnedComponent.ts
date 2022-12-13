import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface TeamOwnedComponentData {
    teamId: string | null;
}

export class TeamOwnedComponent extends Component
    implements TeamOwnedComponentData {
    static TAG = 'TO';

    teamId = null;
}

registerComponent(TeamOwnedComponent,
	createAssert<Partial<TeamOwnedComponentData>>());
