import { Component } from '@/ecs/Component';

export interface MoveableComponentData {}

export class MoveableComponent
    extends Component<MoveableComponent>
    implements MoveableComponentData {}
