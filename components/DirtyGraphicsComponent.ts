import { Component } from '@/ecs/Component';

export interface DirtyGraphicsComponentData {}

export class DirtyGraphicsComponent
    extends Component<DirtyGraphicsComponent>
    implements DirtyGraphicsComponentData {
}
