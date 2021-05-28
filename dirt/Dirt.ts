import GameObject from '@/object/GameObject';
import Point from '@/physics/point/Point';

export default class Dirt extends GameObject {
    get position(): Point {
        return super.position;
    }

    set position(value: Point) {
        super.position = value;
        this.updateGraphicsMeta();
    }

    protected updateGraphicsMeta(): void {
        this._graphicsMeta = [{
            position: this.position,
        }];
    }
}
