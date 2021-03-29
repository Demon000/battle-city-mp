import GameObject, { GameObjectOptions } from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { ISprite } from '@/object/IGameObjectProperties';
import { ExplosionType } from './ExplosionType';

export interface ExplosionOptions extends GameObjectOptions {
    explosionType: ExplosionType;
    destroyedObjectType: GameObjectType;
}

export default class Explosion extends GameObject {
    explosionType: ExplosionType;
    destroyedObjectType: GameObjectType;

    constructor(options: ExplosionOptions) {
        options.type = GameObjectType.EXPLOSION;

        super(options);

        this.explosionType = options.explosionType;
        this.destroyedObjectType = options.destroyedObjectType;
    }

    get sprite(): ISprite | undefined {
        const sets = GameObjectProperties.findSpriteSets(this);
        for (const set of sets) {
            if (set.meta?.explosionType === this.explosionType) {
                return GameObjectProperties.findAnimationSprite(this, set);
            }
        }

        return undefined;
    }

    toOptions(): ExplosionOptions {
        const gameObjectOption = super.toOptions();
        return Object.assign(gameObjectOption, {
            explosionType: this.explosionType,
            destroyedObjectType: this.destroyedObjectType,
        });
    }

    setOptions(other: Explosion): void {
        super.setOptions(other);
        this.explosionType = other.explosionType;
        this.destroyedObjectType = other.destroyedObjectType;
    }
}
