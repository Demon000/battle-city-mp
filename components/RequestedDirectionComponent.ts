import { Component, ComponentFlags } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface RequestedDirectionComponentData {
    value: Direction;
}

export class RequestedDirectionComponent extends Component
    implements RequestedDirectionComponentData {
    static TAG = 'RD';
    static BASE_FLAGS = ComponentFlags.LOCAL_ONLY;

    value = Direction.UP;
}

registerComponent(RequestedDirectionComponent,
    createAssert<Partial<RequestedDirectionComponentData>>());
