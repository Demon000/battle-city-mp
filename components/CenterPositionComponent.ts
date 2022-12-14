import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface CenterPositionComponentData extends Point {}

export class CenterPositionComponent extends Component
    implements CenterPositionComponentData {
    static TAG = 'CP';

    x = 0;
    y = 0;
}

registerComponent(CenterPositionComponent,
    createAssert<Partial<CenterPositionComponentData>>());
