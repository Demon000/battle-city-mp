import { Component } from '@/ecs/Component';

export interface TeamOwnedComponentData {
    teamId: string | null;
}

export class TeamOwnedComponent extends Component
    implements TeamOwnedComponentData {
    static TAG = 'TO';

    teamId = null;
}
