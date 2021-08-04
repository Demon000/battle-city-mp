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
        return {
            ...super.toOptions(),
            teamId: this.teamId,
        };
    }

    toSaveOptions(): PlayerSpawnOptions {
        return {
            ...super.toSaveOptions(),
            teamId: this.teamId,
        };
    }

    setOptions(options: PlayerSpawnOptions): void {
        super.setOptions(options);

        this.teamId = options.teamId ?? this.teamId;
    }
}
