import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import Point from '@/physics/point/Point';

export default class BrickWall extends GameObject {
    constructor(options: GameObjectOptions) {
        options.type = GameObjectType.BRICK_WALL;

        super(options);
    }

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
