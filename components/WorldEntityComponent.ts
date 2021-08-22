import { Component } from '@/ecs/Component';

export interface WorldEntityComponentData {}

export class WorldEntityComponent
    extends Component<WorldEntityComponent>
    implements WorldEntityComponentData {
}
