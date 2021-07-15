import { Registry } from '@/ecs/Registry';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';

export interface PlayerSpawnOptions extends GameObjectOptions {
    teamId?: string | null;
}

export class PlayerSpawn extends GameObject {
    teamId: string | null;

    constructor(options: PlayerSpawnOptions, properties: GameObjectProperties, registry: Registry) {
        options.type = GameObjectType.PLAYER_SPAWN;

        super(options, properties, registry);

        this.teamId = options.teamId ?? null;
    }

    toOptions(): PlayerSpawnOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            teamId: this.teamId,
        });
    }

    toSaveOptions(): PlayerSpawnOptions {
        const gameObjectSaveOptions = super.toSaveOptions();
        return Object.assign(gameObjectSaveOptions, {
            teamId: this.teamId,
        });
    }

    setOptions(options: PlayerSpawnOptions): void {
        super.setOptions(options);

        this.teamId = options.teamId ?? this.teamId;
    }
}
