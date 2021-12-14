import { Component } from '@/ecs/Component';

export interface SpawnComponentData {}

export class SpawnComponent
    extends Component<SpawnComponent>
    implements SpawnComponentData {
    static TAG = 'S';
}
