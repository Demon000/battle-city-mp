import { Bullet, BulletOptions } from '@/bullet/Bullet';
import { Config } from '@/config/Config';
import { Registry } from '@/ecs/Registry';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { Explosion, ExplosionOptions } from '@/explosion/Explosion';
import { Flag, FlagOptions } from '@/flag/Flag';
import { PlayerSpawn, PlayerSpawnOptions } from '@/player-spawn/PlayerSpawn';
import { Tank, TankOptions, TankProperties } from '../tank/Tank';
import { GameObject, GameObjectOptions } from './GameObject';
import { GameObjectProperties } from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import { ComponentFlags } from '@/ecs/Component';

export class GameObjectFactory {
    constructor(
        private registry: Registry,
        private config: Config,
        private entityBlueprint: EntityBlueprint,
    ) {}

    buildFromOptions(options: GameObjectOptions): GameObject {
        if (options.type === undefined) {
            throw new Error('Cannot create object from options without a type');
        }

        if (options.id === undefined) {
            options.id = this.registry.generateId();
        }

        const properties = this.config.get<GameObjectProperties>('game-object-properties', options.type);
        let object;

        if (options.type === GameObjectType.TANK) {
            object = new Tank(options as TankOptions, properties as TankProperties, this.registry);
        } else if (options.type === GameObjectType.BULLET) {
            object = new Bullet(options as BulletOptions, properties, this.registry);
        } else if (options.type === GameObjectType.EXPLOSION) {
            object = new Explosion(options as ExplosionOptions, properties, this.registry);
        } else if (options.type === GameObjectType.PLAYER_SPAWN) {
            object = new PlayerSpawn(options as PlayerSpawnOptions, properties, this.registry);
        } else if (options.type === GameObjectType.FLAG) {
            object = new Flag(options as FlagOptions, properties, this.registry);
        } else {
            object = new GameObject(options, properties, this.registry);
        }

        let components;

        components = this.entityBlueprint.getCommonComponents(options.type);
        if (components !== undefined) {
            object.addComponents(components, {
                silent: true,
            });
        }

        components = this.entityBlueprint.getEnvComponents(options.type);
        if (components !== undefined) {
            let flags = 0;

            const env = this.entityBlueprint.getEnv();
            if (env === BlueprintEnv.SERVER) {
                flags |= ComponentFlags.SERVER_ONLY;
            }

            object.addComponents(components, {
                silent: true,
                flags,
            });
        }

        if (options.components !== undefined) {
            object.addComponents(options.components, {
                silent: true,
            });
        }

        return object;
    }
}
