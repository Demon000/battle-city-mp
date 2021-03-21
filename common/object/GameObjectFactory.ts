import Point from '../physics/point/Point';
import Tank, { TankOptions } from '../tank/Tank';
import GameObject, { GameObjectOptions } from './GameObject';
import GameObjectProperties, { GameObjectType } from './GameObjectProperties';

export default class GameObjectFactory {
    static buildMapObject(shortType: string, position: Point): GameObject {
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
        } else  {
            return new GameObject(options);
        }
    }
}
