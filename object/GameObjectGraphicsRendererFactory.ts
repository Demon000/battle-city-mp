import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionGraphicsRenderer from '../explosion/ExplosionGraphicsRenderer';
import GameObjectGraphicsRenderer from './GameObjectGraphicsRenderer';
import TankGraphicsRenderer from '../tank/TankGraphicsRenderer';

export default class GameObjectGraphicsRendererFactory {
    static buildFromObject(object: GameObject): GameObjectGraphicsRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankGraphicsRenderer(object);
            case GameObjectType.EXPLOSION:
                return new ExplosionGraphicsRenderer(object);
            default:
                return new GameObjectGraphicsRenderer(object);
        }
    }
}
