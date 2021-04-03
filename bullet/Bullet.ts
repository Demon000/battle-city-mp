import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { BulletPower } from './BulletPower';

export interface BulletOptions extends GameObjectOptions {
    tankId: number;
    power: BulletPower;
}

export default class Bullet extends GameObject {
    tankId: number;
    power: BulletPower;

    constructor(options: BulletOptions) {
        options.type = GameObjectType.BULLET;

        super(options);

        this.tankId = options.tankId;
        this.power = options.power;
    }

    toOptions(): BulletOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            tankId: this.tankId,
            power: this.power,
        });
    }

    setOptions(other: Bullet): void {
        super.setOptions(other);
        this.tankId = other.tankId;
    }
}
