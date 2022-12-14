import { Component, ComponentFlags } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface RequestedPositionComponentData extends Point {}

export class RequestedPositionComponent extends Component
    implements RequestedPositionComponentData {
    static TAG = 'RP';
    static BASE_FLAGS = ComponentFlags.LOCAL_ONLY;

    x = 0;
    y = 0;
}

registerComponent(RequestedPositionComponent,
    createAssert<Partial<RequestedPositionComponentData>>());
