import { Component } from '@/ecs/Component';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';

export interface BoundingBoxComponentData extends BoundingBox {}

export class BoundingBoxComponent
    extends Component<BoundingBoxComponent>
    implements BoundingBoxComponentData {
    tl = {
        x: 0,
        y: 0,
    };

    br = {
        x: 0,
        y: 0,
    };
}
