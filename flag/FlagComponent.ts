import { Component } from '@/ecs/Component';

export interface FlagComponentData {
    sourceId: number;
    droppedTankId: number;
}

export class FlagComponent
    extends Component<FlagComponent>
    implements FlagComponentData {
    sourceId = -1;
    droppedTankId = -1;
}
