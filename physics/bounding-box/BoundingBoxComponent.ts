import { Component } from '@/ecs/Component';
import { SizeComponent } from '../size/SizeComponent';
import { PositionComponent } from '../point/PositionComponent';
import { BoundingBox } from './BoundingBox';

export interface BoundingBoxComponentData {
    readonly value: BoundingBox;
}

export class BoundingBoxComponent
    extends Component<BoundingBoxComponent>
    implements BoundingBoxComponentData {
    get value(): BoundingBox {
        const position = this.entity.getComponent(PositionComponent);
        const size = this.entity.getComponent(SizeComponent);
        return {
            tl: position,
            br: {
                x: position.x + size.width,
                y: position.y + size.height,
            },
        };
    }
}
