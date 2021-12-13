import { Registry } from '@/ecs/Registry';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';

export interface ExplosionOptions extends GameObjectOptions {
    explosionType: string;
    destroyedObjectType?: string;
}

export type PartialExplosionOptions = Partial<ExplosionOptions>;

export class Explosion extends GameObject {
    explosionType: string;
    destroyedObjectType?: string;

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

    protected updateAudioMeta(): void {
        this._audioMeta = {
            destroyedObjectType: this.destroyedObjectType,
        };
    }
}
