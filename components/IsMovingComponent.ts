import { Component } from '@/ecs/Component';

export interface IsMovingComponentData {}

export class IsMovingComponent
    extends Component<IsMovingComponent>
    implements IsMovingComponentData {
}
