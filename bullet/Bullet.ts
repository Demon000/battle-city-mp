import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { BulletPower } from './BulletPower';

export interface BulletOptions extends GameObjectOptions {
    tankId: number;
    power: BulletPower;
}

export type PartialBulletOptions = Partial<BulletOptions>;

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

    setOptions(options: PartialBulletOptions): void {
        super.setOptions(options);

        if (options.tankId !== undefined) {
            this.tankId = options.tankId;
        }

        if (options.power !== undefined) {
            this.power = options.power;
        }
    }

    get metas(): ResourceMeta[] {
        return [{
            ...super.metas[0],
            power: this.power,
        }];
    }
}
