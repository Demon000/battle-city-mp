import { Bullet, BulletOptions } from '@/bullet/Bullet';
import { Config } from '@/config/Config';
import { Explosion, ExplosionOptions } from '@/explosion/Explosion';
import { Flag, FlagOptions } from '@/flag/Flag';
import { PlayerSpawn, PlayerSpawnOptions } from '@/player-spawn/PlayerSpawn';
import { Tank, TankOptions, TankProperties } from '../tank/Tank';
import { GameObject, GameObjectOptions } from './GameObject';
import { GameObjectProperties } from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';

export class GameObjectFactory {
    constructor(
        private config: Config,
    ) {}

    buildFromOptions(options: GameObjectOptions): GameObject {
        if (options.type === undefined) {
            throw new Error('Cannot create object from options without a type');
        }

        const properties = this.config.get<GameObjectProperties>('game-object-properties', options.type);
        if (options.type === GameObjectType.TANK) {
            return new Tank(options as TankOptions, properties as TankProperties);
        } else if (options.type === GameObjectType.BULLET) {
            return new Bullet(options as BulletOptions, properties);
        } else if (options.type === GameObjectType.EXPLOSION) {
            return new Explosion(options as ExplosionOptions, properties);
        } else if (options.type === GameObjectType.PLAYER_SPAWN) {
            return new PlayerSpawn(options as PlayerSpawnOptions, properties);
        } else if (options.type === GameObjectType.FLAG) {
            return new Flag(options as FlagOptions, properties);
        } else {
            return new GameObject(options, properties);
        }
    }
}
