import { Component } from '@/ecs/Component';
import SizeComponent from '../size/SizeComponent';
import PointUtils from '../point/PointUtils';
import PositionComponent from '../point/PositionComponent';
import BoundingBox from './BoundingBox';
import SizeUtils from '../size/SizeUtils';

export interface BoundingBoxComponentData {
    readonly value: BoundingBox;
}

export default class BoundingBoxComponent
    extends Component<BoundingBoxComponent>
    implements BoundingBoxComponentData {
    get value(): BoundingBox {
        const positionComponent = this.entity.getComponent(PositionComponent);
        const sizeComponent = this.entity.getComponent(SizeComponent);
        return {
            tl: positionComponent.value,
            br: PointUtils.add(
                positionComponent.value,
                SizeUtils.toPoint(sizeComponent.value),
            ),
        };
    }
}
