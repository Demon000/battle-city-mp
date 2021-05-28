import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ObjectUtils from '@/utils/ObjectUtils';
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

export default class Bullet extends GameObject {
    tankId: number;
    playerId?: string;
    power: BulletPower;
    damage: number;

    constructor(options: BulletOptions) {
        options.type = GameObjectType.BULLET;

        super(options);

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
        ObjectUtils.keysAssign(this, [
            'tankId',
            'power',
        ], options);
    }

    protected updateGraphicsMeta(): void {
        this._graphicsMeta = [{
            direction: this.direction,
            power: this.power,
        }];
    }

    protected updateAudioMeta(): void {
        this._audioMeta = {};
    }
}
