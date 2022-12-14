import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface RelativePositionChildrenComponentData {
    ids: Record<string, boolean>;
}

export class RelativePositionChildrenComponent extends Component
    implements RelativePositionChildrenComponentData {
    static TAG = 'RPC';

    ids: Record<string, boolean> = {};
}

registerComponent(RelativePositionChildrenComponent,
    createAssert<Partial<RelativePositionChildrenComponentData>>());
