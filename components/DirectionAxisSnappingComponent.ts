import { Component } from '@/ecs/Component';

export interface DirectionAxisSnappingComponentData {
    readonly value: number;
}

export class DirectionAxisSnappingComponent
    extends Component<DirectionAxisSnappingComponent>
    implements DirectionAxisSnappingComponentData {
    static TAG = 'DAS';

    value = 0;
}
