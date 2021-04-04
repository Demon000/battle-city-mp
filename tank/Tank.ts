import { BulletPower } from '@/bullet/BulletPower';
import { ISprite, ResourceMeta } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
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
    [TankTier.NORMAL]: 128,
    [TankTier.LIGHT]: 160,
    [TankTier.HEAVY]: 192,
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
    [TankTier.NORMAL]: 0.0001,
    [TankTier.LIGHT]: 0.5,
    [TankTier.HEAVY]: 0.5,
};

export interface TankOptions extends GameObjectOptions {
    tier: TankTier;
    playerId?: string;
    isShooting?: boolean;
    isOnIce?: boolean;
    lastSlippingTime?: number;
    lastBulletShotTime?: number;
    bulletIds?: number[];
}

export default class Tank extends GameObject {
    tier: TankTier;
    playerId?: string;
    isShooting: boolean;
    isSlipping: boolean;
    lastSlippingTime: number;
    lastBulletShotTime: number;
    bulletIds: number[];

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier;
        this.playerId = options.playerId;
        this.isShooting = options.isShooting ?? false;
        this.isSlipping = options.isOnIce ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSlippingTime = options.lastSlippingTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
    }

    toOptions(): TankOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            tier: this.tier,
            playerId: this.playerId,
            lastSlippingTime: this.lastSlippingTime,
            lastBulletShotTime: this.lastBulletShotTime,
            bulletIds: this.bulletIds,
        });
    }

    setOptions(other: Tank): void {
        super.setOptions(other);
        this.tier = other.tier;
        this.playerId = other.playerId;
        this.lastSlippingTime = other.lastSlippingTime;
        this.lastBulletShotTime = other.lastBulletShotTime;
        this.bulletIds = other.bulletIds;
    }

    get sprite(): ISprite | undefined {
        if (this.movementSpeed > 0) {
            this.invalidateSprite = true;
        }

        return super.sprite;
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
        return tierToBulletSpeedMap[this.tier];
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

    isMatchingMeta(meta: ResourceMeta): boolean {
        if (meta.isMoving === undefined && meta.isMoving !== this.movementSpeed > 0) {
            return false;
        }

        if (meta.tier !== this.tier) {
            return false;
        }

        return true;
    }
}
