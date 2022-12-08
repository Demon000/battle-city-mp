import { Component } from '@/ecs/Component';

export interface TeamComponentData {}

export class TeamComponent
    extends Component<TeamComponent>
    implements TeamComponentData {
    static TAG = 'TEA';
}
