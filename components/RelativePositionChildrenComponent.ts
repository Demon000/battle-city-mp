import { Component } from '@/ecs/Component';

export interface RelativePositionChildrenComponentData {
    ids: Record<string, boolean>;
}

export class RelativePositionChildrenComponent extends Component
    implements RelativePositionChildrenComponentData {
    static TAG = 'RPC';

    ids: Record<string, boolean> = {};
}
