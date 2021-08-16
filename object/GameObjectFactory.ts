import { Config } from '@/config/Config';
import { Registry } from '@/ecs/Registry';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { Explosion, ExplosionOptions } from '@/explosion/Explosion';
import { Flag, FlagOptions } from '@/flag/Flag';
import { PlayerSpawn, PlayerSpawnOptions } from '@/player-spawn/PlayerSpawn';
import { Tank, TankOptions, TankProperties } from '../tank/Tank';
import { GameObject, GameObjectOptions } from './GameObject';
import { GameObjectProperties } from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import { ComponentsInitialization } from '@/ecs/Component';

export interface GameObjectFactoryBuildOptions {
    type: string,
    subtypes?: string[],
    options?: GameObjectOptions,
    components?: ComponentsInitialization,
    silent?: boolean
}

export class GameObjectFactory {
    constructor(
        private registry: Registry,
        private config: Config,
        private entityBlueprint: EntityBlueprint,
    ) {}

    buildFromOptions(buildOptions: GameObjectFactoryBuildOptions): GameObject {
        if (buildOptions.options === undefined) {
            buildOptions.options = {};
        }
        const options = buildOptions.options;

        if (options.id === undefined) {
            options.id = this.registry.generateId();
        }

        if (options.type === undefined) {
            options.type = buildOptions.type;
        }

        if (options.subtypes === undefined) {
            options.subtypes = buildOptions.subtypes;
        }

        let properties = this.config.find<GameObjectProperties>('game-object-properties', options.type);
        if (properties === undefined) {
            properties = {
                type: options.type,
            };
        }
        let object;

        if (options.type === GameObjectType.TANK) {
            object = new Tank(options as TankOptions, properties as TankProperties, this.registry);
        } else if (options.type === GameObjectType.EXPLOSION) {
            object = new Explosion(options as ExplosionOptions, properties, this.registry);
        } else if (options.type === GameObjectType.PLAYER_SPAWN) {
            object = new PlayerSpawn(options as PlayerSpawnOptions, properties, this.registry);
        } else if (options.type === GameObjectType.FLAG) {
            object = new Flag(options as FlagOptions, properties, this.registry);
        } else {
            object = new GameObject(options, properties, this.registry);
        }

        let fullType = options.type;
        if (buildOptions.subtypes) {
            fullType += '-';
            fullType += buildOptions.subtypes.join('-');
        }

        this.entityBlueprint.addComponents(fullType, object, {
            silent: true,
        });

        const components = buildOptions.components;
        if (components !== undefined) {
            object.upsertComponents(components, {
                silent: true,
            });
        }

        if (!buildOptions.silent) {
            this.registry.registerEntity(object);
        }

        return object;
    }
}
