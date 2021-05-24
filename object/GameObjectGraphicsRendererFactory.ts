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
    buildFromObject(
        object: GameObject,
    ): GameObjectGraphicsRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankGraphicsRenderer(object as Tank);
            case GameObjectType.BULLET:
                return new BulletGraphicsRenderer(object as Bullet);
            case GameObjectType.EXPLOSION:
                return new ExplosionGraphicsRenderer(object as Explosion);
            default:
                return new GameObjectGraphicsRenderer(object);
        }
    }
}
