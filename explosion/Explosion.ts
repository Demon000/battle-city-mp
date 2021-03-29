import GameObject, { GameObjectOptions } from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { ISprite } from '@/object/IGameObjectProperties';
import { ExplosionType } from './ExplosionType';

export interface ExplosionOptions extends GameObjectOptions {
    explosionType: ExplosionType;
}

export default class Explosion extends GameObject {
    explosionType: ExplosionType;

    constructor(options: ExplosionOptions) {
        options.type = GameObjectType.EXPLOSION;

        super(options);

        this.explosionType = options.explosionType;
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
        });
    }

    setOptions(other: Explosion): void {
        super.setOptions(other);
        this.explosionType = other.explosionType;
    }
}
