import { Component } from '@/ecs/Component';

export interface DestroyedComponentData {}

export class DestroyedComponent
    extends Component<DestroyedComponent>
    implements DestroyedComponentData {}
