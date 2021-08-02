import { Component } from '@/ecs/Component';

export interface IsMovingComponentData {
    readonly value: boolean;
}

export class IsMovingComponent
    extends Component<IsMovingComponent>
    implements IsMovingComponentData {
    value = false;
}
