import { Component } from '@/ecs/Component';

export interface CollisionComponentData {}

export default class CollisionComponent
    extends Component<CollisionComponent>
    implements CollisionComponentData {
}
