import Point from '../physics/point/Point';
import GameObject from './GameObject';
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
}
