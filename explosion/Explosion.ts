import GameObject, { GameObjectOptions } from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { ISprite, ResourceMeta } from '@/object/IGameObjectProperties';
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

    get automaticDestroyTime(): number | undefined {
        const set = GameObjectProperties.findSpriteSet(this);
        return set?.duration;
    }

    get sprite(): ISprite | null | undefined {
        this._sprite = null;
        return super.sprite;
    }

    isMatchingMeta(meta: ResourceMeta): boolean {
        if (meta.explosionType === this.explosionType) {
            return true;
        }

        if (meta.destroyedObjectType === this.destroyedObjectType) {
            return true;
        }

        return false;
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

        if (options.explosionType !== undefined) {
            this.explosionType = options.explosionType;
        }

        if (options.destroyedObjectType !== undefined) {
            this.destroyedObjectType = options.destroyedObjectType;
        }
    }
}
