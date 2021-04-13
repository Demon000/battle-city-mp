import { BulletPower } from '@/bullet/BulletPower';
import { Color } from '@/drawable/Color';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
// import { TankSmoke } from './TankSmoke';
import { TankTier } from './TankTier';

const tierToMaxSpeedMap = {
    [TankTier.NORMAL]: 64,
    [TankTier.LIGHT]: 96,
    [TankTier.HEAVY]: 48,
};

const tierToAccelerationFactorMap = {
    [TankTier.NORMAL]: 3,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 1,
};

const tierToDecelerationFactorMap = {
    [TankTier.NORMAL]: 4,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 1,
};

const tierToBulletSpeedMap = {
    [TankTier.NORMAL]: 64,
    [TankTier.LIGHT]: 64,
    [TankTier.HEAVY]: 64,
};

const tierToMaxBulletsMap = {
    [TankTier.NORMAL]: 2,
    [TankTier.LIGHT]: 3,
    [TankTier.HEAVY]: 4,
};

const tierToBulletCooldownMap = {
    [TankTier.NORMAL]: 250,
    [TankTier.LIGHT]: 250,
    [TankTier.HEAVY]: 500,
};

const tierToBulletPowerMap = {
    [TankTier.NORMAL]: BulletPower.LIGHT,
    [TankTier.LIGHT]: BulletPower.LIGHT,
    [TankTier.HEAVY]: BulletPower.HEAVY,
};

const tierToSlippingTimeMap = {
    [TankTier.NORMAL]: 1000,
    [TankTier.LIGHT]: 1000,
    [TankTier.HEAVY]: 1000,
};

const tierToSlippingMaxSpeedMap = {
    [TankTier.NORMAL]: 1.5,
    [TankTier.LIGHT]: 1.5,
    [TankTier.HEAVY]: 1.5,
};

const tierToSlippingAccelerationMap = {
    [TankTier.NORMAL]: 10,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 2,
};

const tierToSlippingDecelerationMap = {
    [TankTier.NORMAL]: 0.5,
    [TankTier.LIGHT]: 0.5,
    [TankTier.HEAVY]: 0.5,
};

export interface TankOptions extends GameObjectOptions {
    tier: TankTier;
    playerId: string;
    playerName: string;
    isShooting?: boolean;
    isOnIce?: boolean;
    lastSlippingTime?: number;
    lastBulletShotTime?: number;
    bulletIds?: number[];
    color?: Color;
}

export type PartialTankOptions = Partial<TankOptions>;

export default class Tank extends GameObject {
    tier: TankTier;
    playerId: string;
    playerName: string;
    isShooting: boolean;
    isSlipping: boolean;
    lastSlippingTime: number;
    lastBulletShotTime: number;
    bulletIds: number[];
    color: Color;

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier;
        this.playerId = options.playerId;
        this.playerName = options.playerName;
        this.isShooting = options.isShooting ?? false;
        this.isSlipping = options.isOnIce ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSlippingTime = options.lastSlippingTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
        this.color = options.color ?? [231, 156, 33];
    }

    toOptions(): TankOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            tier: this.tier,
            playerId: this.playerId,
            playerName: this.playerName,
            lastSlippingTime: this.lastSlippingTime,
            lastBulletShotTime: this.lastBulletShotTime,
            bulletIds: this.bulletIds,
            color: this.color,
        });
    }

    setOptions(options: PartialTankOptions): void {
        super.setOptions(options);

        if (options.tier !== undefined) {
            this.tier = options.tier;
        }

        if (options.playerId !== undefined) {
            this.playerId = options.playerId;
        }

        if (options.playerName !== undefined) {
            this.playerName = options.playerName;
        }

        if (options.lastSlippingTime !== undefined) {
            this.lastSlippingTime = options.lastSlippingTime;
        }

        if (options.lastBulletShotTime !== undefined) {
            this.lastBulletShotTime = options.lastBulletShotTime;
        }

        if (options.bulletIds !== undefined) {
            this.bulletIds = options.bulletIds;
        }

        if (options.color !== undefined) {
            this.color = options.color;
        }
    }

    get maxMovementSpeed(): number {
        let speed = tierToMaxSpeedMap[this.tier];
        if (this.isSlipping) {
            speed *= tierToSlippingMaxSpeedMap[this.tier];
        }

        return speed;
    }

    get accelerationFactor(): number {
        let factor = tierToAccelerationFactorMap[this.tier];
        if (this.isSlipping) {
            factor *= tierToSlippingAccelerationMap[this.tier];
        }

        return factor;
    }

    get delecerationFactor(): number {
        let factor = tierToDecelerationFactorMap[this.tier];
        if (this.isSlipping) {
            factor *= tierToSlippingDecelerationMap[this.tier];
        }

        return factor;
    }

    get slippingTime(): number {
        return tierToSlippingTimeMap[this.tier];
    }

    get bulletSpeed(): number {
        return tierToBulletSpeedMap[this.tier] + this.maxMovementSpeed;
    }

    get bulletPower(): BulletPower {
        return tierToBulletPowerMap[this.tier];
    }

    get maxBullets(): number {
        return tierToMaxBulletsMap[this.tier];
    }

    get bulletCooldown(): number {
        return tierToBulletCooldownMap[this.tier];
    }

    get graphicsMeta(): ResourceMeta[] | undefined | null {
        return [
            {
                isTank: true,
                direction: this.direction,
                isMoving: this.isMoving,
                tier: this.tier,
            },
            {
                isText: true,
            },
            // {
            //     smoke: TankSmoke.BIG,
            // },
        ];
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return {
            isMoving: this.isMoving,
        };
    }
}
