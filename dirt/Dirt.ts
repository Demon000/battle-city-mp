import { GameObject } from '@/object/GameObject';
import { Point } from '@/physics/point/Point';

export class Dirt extends GameObject {
    get position(): Point {
        return super.position;
    }

    set position(value: Point) {
        super.position = value;
        this.markGraphicsMetaUpdated();
    }

    protected updateGraphicsMeta(): void {
        this._graphicsMeta = [{
            position: this.position,
        }];
    }
}
