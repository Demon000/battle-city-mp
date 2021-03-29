import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';

export interface BulletOptions extends GameObjectOptions {
    tankId: number;
}

export default class Bullet extends GameObject {
    tankId: number;

    constructor(options: BulletOptions) {
        options.type = GameObjectType.BULLET;

        super(options);

        this.tankId = options.tankId;
    }

    toOptions(): BulletOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            tankId: this.tankId,
        });
    }

    setOptions(other: Bullet): void {
        super.setOptions(other);
        this.tankId = other.tankId;
    }
}
