import { Component } from '@/ecs/Component';

export interface TeamComponentData {}

export class TeamComponent extends Component
    implements TeamComponentData {
    static TAG = 'TEA';
}
