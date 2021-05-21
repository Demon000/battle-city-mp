import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionGraphicsRenderer from '../explosion/ExplosionGraphicsRenderer';
import GameObjectGraphicsRenderer from './GameObjectGraphicsRenderer';
import TankGraphicsRenderer from '../tank/TankGraphicsRenderer';
import Tank from '@/tank/Tank';
import Explosion from '@/explosion/Explosion';
import Bullet from '@/bullet/Bullet';
import BulletGraphicsRenderer from '@/bullet/BulletGraphicsRenderer';
import { Scene } from 'babylonjs';

export default class GameObjectGraphicsRendererFactory {
    buildFromObject(
        object: GameObject,
        scene: Scene | undefined,
    ): GameObjectGraphicsRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankGraphicsRenderer(object as Tank, scene);
            case GameObjectType.BULLET:
                return new BulletGraphicsRenderer(object as Bullet, scene);
            case GameObjectType.EXPLOSION:
                return new ExplosionGraphicsRenderer(object as Explosion, scene);
            default:
                return new GameObjectGraphicsRenderer(object, scene);
        }
    }
}
