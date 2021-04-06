import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionGraphicsRenderer from '../explosion/ExplosionGraphicsRenderer';
import GameObjectGraphicsRenderer from './GameObjectGraphicsRenderer';
import TankGraphicsRenderer from '../tank/TankGraphicsRenderer';

export default class GameObjectGraphicsRendererFactory {
    static buildFromObject(object: GameObject, context: CanvasRenderingContext2D): GameObjectGraphicsRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankGraphicsRenderer(object, context);
            case GameObjectType.EXPLOSION:
                return new ExplosionGraphicsRenderer(object, context);
            default:
                return new GameObjectGraphicsRenderer(object, context);
        }
    }
}
