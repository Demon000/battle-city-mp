import { BulletPower } from '@/bullet/BulletPower';
import { ISprite, ResourceMeta } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

const tierToMaxSpeedMap = {
    [TankTier.PLAYER_TIER_1]: 48,
    [TankTier.PLAYER_TIER_2]: 24,
    [TankTier.PLAYER_TIER_3]: 24,
    [TankTier.PLAYER_TIER_4]: 24,
};

const tierToAccelerationFactorMap = {
    [TankTier.PLAYER_TIER_1]: 2,
    [TankTier.PLAYER_TIER_2]: 1,
    [TankTier.PLAYER_TIER_3]: 1,
    [TankTier.PLAYER_TIER_4]: 1,
};

const tierToDecelerationFactorMap = {
    [TankTier.PLAYER_TIER_1]: 4,
    [TankTier.PLAYER_TIER_2]: 1,
    [TankTier.PLAYER_TIER_3]: 1,
    [TankTier.PLAYER_TIER_4]: 1,
};

const tierToBulletSpeedMap = {
    [TankTier.PLAYER_TIER_1]: 64,
    [TankTier.PLAYER_TIER_2]: 32,
    [TankTier.PLAYER_TIER_3]: 32,
    [TankTier.PLAYER_TIER_4]: 48,
};

const tierToMaxBulletsMap = {
    [TankTier.PLAYER_TIER_1]: 1,
    [TankTier.PLAYER_TIER_2]: 2,
    [TankTier.PLAYER_TIER_3]: 2,
    [TankTier.PLAYER_TIER_4]: 2,
};

const tierToBulletCooldownMap = {
    [TankTier.PLAYER_TIER_1]: 250,
    [TankTier.PLAYER_TIER_2]: 250,
    [TankTier.PLAYER_TIER_3]: 250,
    [TankTier.PLAYER_TIER_4]: 250,
};

const tierToBulletPowerMap = {
    [TankTier.PLAYER_TIER_1]: BulletPower.DESTROY_BRICK_POWER,
    [TankTier.PLAYER_TIER_2]: BulletPower.DESTROY_BRICK_POWER,
    [TankTier.PLAYER_TIER_3]: BulletPower.DESTROY_BRICK_POWER,
    [TankTier.PLAYER_TIER_4]: BulletPower.DESTROY_BRICK_POWER,
};

const tierToSlippingTimeMap = {
    [TankTier.PLAYER_TIER_1]: 1000,
    [TankTier.PLAYER_TIER_2]: 1000,
    [TankTier.PLAYER_TIER_3]: 1000,
    [TankTier.PLAYER_TIER_4]: 1000,
};

const tierToSlippingMaxSpeedMap = {
    [TankTier.PLAYER_TIER_1]: 1.5,
    [TankTier.PLAYER_TIER_2]: 1.5,
    [TankTier.PLAYER_TIER_3]: 1.5,
    [TankTier.PLAYER_TIER_4]: 1.5,
};

const tierToSlippingAccelerationMap = {
    [TankTier.PLAYER_TIER_1]: 2,
    [TankTier.PLAYER_TIER_2]: 2,
    [TankTier.PLAYER_TIER_3]: 2,
    [TankTier.PLAYER_TIER_4]: 2,
};

const tierToSlippingDecelerationMap = {
    [TankTier.PLAYER_TIER_1]: 0.5,
    [TankTier.PLAYER_TIER_2]: 0.5,
    [TankTier.PLAYER_TIER_3]: 0.5,
    [TankTier.PLAYER_TIER_4]: 0.5,
};

export interface TankOptions extends GameObjectOptions {
    tier?: TankTier;
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

        this.tier = options.tier ?? TankTier.PLAYER_TIER_1;
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
        if (meta.isMoving && this.movementSpeed > 0) {
            return true;
        }

        return false;
    }
}
