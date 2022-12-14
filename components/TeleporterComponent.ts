import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface TeleporterComponentData {
    target: Point;
}

export class TeleporterComponent extends Component
    implements TeleporterComponentData {
    static TAG = 'TE';

    target = {
        x: 0,
        y: 0,
    };
}

registerComponent(TeleporterComponent,
    createAssert<Partial<TeleporterComponentData>>());
