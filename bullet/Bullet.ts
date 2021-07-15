import { Registry } from '@/ecs/Registry';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { BulletPower } from './BulletPower';

const bulletPowerToDamageMap = {
    [BulletPower.LIGHT]: 1,
    [BulletPower.HEAVY]: 2,
};

export interface BulletOptions extends GameObjectOptions {
    tankId: number;
    playerId?: string;
    power: BulletPower;
}

export type PartialBulletOptions = Partial<BulletOptions>;

export class Bullet extends GameObject {
    tankId: number;
    playerId?: string;
    power: BulletPower;
    damage: number;

    constructor(options: BulletOptions, properties: GameObjectProperties, registry: Registry) {
        options.type = GameObjectType.BULLET;

        super(options, properties, registry);

        this.tankId = options.tankId;
        this.playerId = options.playerId;
        this.power = options.power;
        this.damage = bulletPowerToDamageMap[this.power];
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

        if (options.tankId !== undefined) this.tankId = options.tankId;
        if (options.power !== undefined) this.power = options.power;
    }

    protected updateAudioMeta(): void {
        this._audioMeta = {};
    }
}
