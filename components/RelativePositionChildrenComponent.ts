import { Component } from '@/ecs/Component';

export interface RelativePositionChildrenComponentData {
    ids: Record<string, boolean>;
}

export class RelativePositionChildrenComponent
    extends Component<RelativePositionChildrenComponent>
    implements RelativePositionChildrenComponentData {
    ids: Record<string, boolean> = {};
}
