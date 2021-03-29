import Bullet, { BulletOptions } from '@/bullet/Bullet';
import Point from '../physics/point/Point';
import Tank, { TankOptions } from '../tank/Tank';
import GameObject, { GameObjectOptions } from './GameObject';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';

export default class GameObjectFactory {
    static buildFromShortType(shortType: string, position: Point): GameObject {
        const properties = GameObjectProperties.getShortTypeProperties(shortType);
        const object = new GameObject({
            type: properties.type as GameObjectType,
            position: position,
        });
        return object;
    }

    static buildFromOptions(options: GameObjectOptions): GameObject {
        if (options.type === GameObjectType.TANK) {
            return new Tank(options as TankOptions);
        } else if (options.type === GameObjectType.BULLET) {
            return new Bullet(options as BulletOptions);
        } else {
            return new GameObject(options);
        }
    }
}
