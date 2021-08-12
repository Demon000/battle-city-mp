import { Component } from '@/ecs/Component';

export interface DirtyCollisionsComponentData {}

export class DirtyCollisionsComponent
    extends Component<DirtyCollisionsComponent>
    implements DirtyCollisionsComponentData {
}
