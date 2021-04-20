import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { ExplosionType } from './ExplosionType';

export interface ExplosionOptions extends GameObjectOptions {
    explosionType: ExplosionType;
    destroyedObjectType?: GameObjectType;
}

export type PartialExplosionOptions = Partial<ExplosionOptions>;

export default class Explosion extends GameObject {
    explosionType: ExplosionType;
    destroyedObjectType?: GameObjectType;

    constructor(options: ExplosionOptions) {
        options.type = GameObjectType.EXPLOSION;

        super(options);

        this.explosionType = options.explosionType;
        this.destroyedObjectType = options.destroyedObjectType;
    }

    toOptions(): ExplosionOptions {
        const gameObjectOption = super.toOptions();
        return Object.assign(gameObjectOption, {
            explosionType: this.explosionType,
            destroyedObjectType: this.destroyedObjectType,
        });
    }

    setOptions(options: PartialExplosionOptions): void {
        super.setOptions(options);
        this.explosionType = options.explosionType ?? this.explosionType;
        this.destroyedObjectType = options.destroyedObjectType ?? this.destroyedObjectType;
    }

    get graphicsMeta(): ResourceMeta[] | undefined | null {
        return [{
            direction: this.direction,
            explosionType: this.explosionType,
        }];
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return {
            destroyedObjectType: this.destroyedObjectType,
        };
    }
}
