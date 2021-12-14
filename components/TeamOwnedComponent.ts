import { Component } from '@/ecs/Component';

export interface TeamOwnedComponentData {
    teamId: string;
}

export class TeamOwnedComponent
    extends Component<TeamOwnedComponent>
    implements TeamOwnedComponentData {
    static TAG = 'TO';

    teamId = 'invalid';
}
