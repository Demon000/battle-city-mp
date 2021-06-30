import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { Point } from '@/physics/point/Point';

export class BrickWall extends GameObject {
    constructor(options: GameObjectOptions, properties: GameObjectProperties) {
        options.type = GameObjectType.BRICK_WALL;

        super(options, properties);
    }

    get position(): Point {
        return super.position;
    }

    set position(value: Point) {
        super.position = value;
        this.markGraphicsDirty();
    }
}
