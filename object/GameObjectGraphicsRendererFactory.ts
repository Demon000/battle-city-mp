import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionGraphicsRenderer from '../explosion/ExplosionGraphicsRenderer';
import GameObjectGraphicsRenderer from './GameObjectGraphicsRenderer';
import TankGraphicsRenderer from '../tank/TankGraphicsRenderer';
import Tank from '@/tank/Tank';
import Explosion from '@/explosion/Explosion';
import Bullet from '@/bullet/Bullet';
import BulletGraphicsRenderer from '@/bullet/BulletGraphicsRenderer';

export default class GameObjectGraphicsRendererFactory {
    static buildFromObject(
        context: CanvasRenderingContext2D,
        object: GameObject,
        scale: number,
    ): GameObjectGraphicsRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankGraphicsRenderer(context, object as Tank, scale);
            case GameObjectType.BULLET:
                return new BulletGraphicsRenderer(context, object as Bullet, scale);
            case GameObjectType.EXPLOSION:
                return new ExplosionGraphicsRenderer(context, object as Explosion, scale);
            default:
                return new GameObjectGraphicsRenderer(context, object, scale);
        }
    }
}
