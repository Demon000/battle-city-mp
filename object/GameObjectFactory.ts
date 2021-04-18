import Bullet, { BulletOptions } from '@/bullet/Bullet';
import Explosion, { ExplosionOptions } from '@/explosion/Explosion';
import Point from '../physics/point/Point';
import Tank, { TankOptions } from '../tank/Tank';
import GameObject, { GameObjectOptions } from './GameObject';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType, GameShortObjectType } from './GameObjectType';
import IGameObjectProperties from './IGameObjectProperties';

export default class GameObjectFactory {
    static buildFromProperties(properties: IGameObjectProperties, position: Point): GameObject {
        const object = new GameObject({
            type: properties.type as GameObjectType,
            position: position,
        });
        return object;
    }

    static buildFromShortType(type: GameShortObjectType, position: Point): GameObject {
        const properties = GameObjectProperties.getShortTypeProperties(type);
        return this.buildFromProperties(properties, position);
    }

    static buildFromType(type: GameObjectType, position: Point): GameObject {
        const properties = GameObjectProperties.getTypeProperties(type);
        return this.buildFromProperties(properties, position);
    }

    static buildFromOptions(options: GameObjectOptions): GameObject {
        if (options.type === GameObjectType.TANK) {
            return new Tank(options as TankOptions);
        } else if (options.type === GameObjectType.BULLET) {
            return new Bullet(options as BulletOptions);
        } else if (options.type === GameObjectType.EXPLOSION) {
            return new Explosion(options as ExplosionOptions);
        } else {
            return new GameObject(options);
        }
    }
}
