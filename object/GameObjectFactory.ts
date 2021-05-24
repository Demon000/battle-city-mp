import BrickWall from '@/brick-wall/BrickWall';
import Bullet, { BulletOptions } from '@/bullet/Bullet';
import Explosion, { ExplosionOptions } from '@/explosion/Explosion';
import Grass from '@/grass/Grass';
import PlayerSpawn, { PlayerSpawnOptions } from '@/player-spawn/PlayerSpawn';
import Tank, { TankOptions } from '../tank/Tank';
import GameObject, { GameObjectOptions } from './GameObject';
import { GameObjectType } from './GameObjectType';

export default class GameObjectFactory {
    buildFromOptions(options: GameObjectOptions): GameObject {
        if (options.type === GameObjectType.TANK) {
            return new Tank(options as TankOptions);
        } else if (options.type === GameObjectType.BRICK_WALL) {
            return new BrickWall(options as GameObjectOptions);
        } else if (options.type === GameObjectType.GRASS) {
            return new Grass(options as GameObjectOptions);
        } else if (options.type === GameObjectType.BULLET) {
            return new Bullet(options as BulletOptions);
        } else if (options.type === GameObjectType.EXPLOSION) {
            return new Explosion(options as ExplosionOptions);
        } else if (options.type === GameObjectType.PLAYER_SPAWN) {
            return new PlayerSpawn(options as PlayerSpawnOptions);
        } else {
            return new GameObject(options);
        }
    }
}
