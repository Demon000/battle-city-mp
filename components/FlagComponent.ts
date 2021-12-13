import { Component } from '@/ecs/Component';

export interface FlagComponentData {
    sourceId: number;
}

export class FlagComponent
    extends Component<FlagComponent>
    implements FlagComponentData {
    sourceId = -1;
}
