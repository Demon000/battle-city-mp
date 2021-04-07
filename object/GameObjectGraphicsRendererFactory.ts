import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionGraphicsRenderer from '../explosion/ExplosionGraphicsRenderer';
import GameObjectGraphicsRenderer from './GameObjectGraphicsRenderer';
import TankGraphicsRenderer from '../tank/TankGraphicsRenderer';

export default class GameObjectGraphicsRendererFactory {
    static buildFromObject(object: GameObject, scale: number): GameObjectGraphicsRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankGraphicsRenderer(object, scale);
            case GameObjectType.EXPLOSION:
                return new ExplosionGraphicsRenderer(object, scale);
            default:
                return new GameObjectGraphicsRenderer(object, scale);
        }
    }
}
