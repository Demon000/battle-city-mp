import { Component } from '@/ecs/Component';

export interface CollisionComponentData {}

export class CollisionComponent
    extends Component<CollisionComponent>
    implements CollisionComponentData {
}
