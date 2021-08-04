import { Registry } from '@/ecs/Registry';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { ExplosionType } from './ExplosionType';

export interface ExplosionOptions extends GameObjectOptions {
    explosionType: ExplosionType;
    destroyedObjectType?: GameObjectType;
}

export type PartialExplosionOptions = Partial<ExplosionOptions>;

export class Explosion extends GameObject {
    explosionType: ExplosionType;
    destroyedObjectType?: GameObjectType;

    constructor(options: ExplosionOptions, properties: GameObjectProperties, registry: Registry) {
        options.type = GameObjectType.EXPLOSION;

        super(options, properties, registry);

        this.explosionType = options.explosionType;
        this.destroyedObjectType = options.destroyedObjectType;
    }

    toOptions(): ExplosionOptions {
        return {
            ...super.toOptions(),
            explosionType: this.explosionType,
            destroyedObjectType: this.destroyedObjectType,
        };
    }

    setOptions(options: PartialExplosionOptions): void {
        super.setOptions(options);

        if (options.explosionType !== undefined) this.explosionType = options.explosionType;
        if (options.destroyedObjectType !== undefined) this.destroyedObjectType = options.destroyedObjectType;
    }

    protected updateAudioMeta(): void {
        this._audioMeta = {
            destroyedObjectType: this.destroyedObjectType,
        };
    }
}
