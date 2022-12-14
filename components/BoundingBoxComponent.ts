import { Component } from '@/ecs/Component';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface BoundingBoxComponentData extends BoundingBox {}

export class BoundingBoxComponent extends Component
    implements BoundingBoxComponentData {
    static TAG = 'BB';

    tl = {
        x: 0,
        y: 0,
    };

    br = {
        x: 0,
        y: 0,
    };
}

registerComponent(BoundingBoxComponent,
    createAssert<Partial<BoundingBoxComponentData>>());
