import { Component } from '@/ecs/Component';

export interface IsUnderBushComponentData {
    readonly value: boolean;
}

export class IsUnderBushComponent
    extends Component<IsUnderBushComponent>
    implements IsUnderBushComponentData {
    value = false;
}
