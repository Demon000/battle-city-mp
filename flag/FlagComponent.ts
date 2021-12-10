import { Component } from '@/ecs/Component';
import { FlagType } from './FlagType';

export interface FlagComponentData {
    sourceId: number;
    droppedTankId: number;
    type: FlagType;
}

export class FlagComponent
    extends Component<FlagComponent>
    implements FlagComponentData {
    type: FlagType = FlagType.FULL;
    sourceId = -1;
    droppedTankId = -1;
}
