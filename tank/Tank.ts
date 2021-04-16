import { BulletPower } from '@/bullet/BulletPower';
import { Color } from '@/drawable/Color';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

const tierToMaxSpeedMap = {
    [TankTier.NORMAL]: 114,
    [TankTier.LIGHT]: 128,
    [TankTier.HEAVY]: 96,
};

const tierToAccelerationFactorMap = {
    [TankTier.NORMAL]: 3,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 1,
};

const tierToDecelerationFactorMap = {
    [TankTier.NORMAL]: 3,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 1,
};

const tierToBulletSpeedMap = {
    [TankTier.NORMAL]: 128,
    [TankTier.LIGHT]: 128,
    [TankTier.HEAVY]: 128,
};

const tierToMaxBulletsMap = {
    [TankTier.NORMAL]: 3,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 1,
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
    [TankTier.NORMAL]: 100,
    [TankTier.LIGHT]: 100,
    [TankTier.HEAVY]: 100,
};

const tierToSlippingMaxSpeedMap = {
    [TankTier.NORMAL]: 1.5,
    [TankTier.LIGHT]: 1.5,
    [TankTier.HEAVY]: 1.5,
};

const tierToSlippingAccelerationMap = {
    [TankTier.NORMAL]: 2,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 2,
};

const tierToSlippingDecelerationMap = {
    [TankTier.NORMAL]: 0.5,
    [TankTier.LIGHT]: 0.5,
    [TankTier.HEAVY]: 0.5,
};

const tierToMaxHealthMap = {
    [TankTier.NORMAL]: 2,
    [TankTier.LIGHT]: 1,
    [TankTier.HEAVY]: 3,
};

const tierHealthToSmokeTime = new Map([
    [1, 500],
    [2, 1000],
]);

export interface TankOptions extends GameObjectOptions {
    tier: TankTier;
    playerId: string;
    playerName: string;
    isShooting?: boolean;
    isOnIce?: boolean;
    lastSlippingTime?: number;
    lastBulletShotTime?: number;
    lastSmokeSpawnTime?: number;
    bulletIds?: number[];
    color?: Color;
    health?: number;
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
    lastSmokeTime: number;
    bulletIds: number[];
    color: Color;
    health: number;

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier;
        this.playerId = options.playerId;
        this.playerName = options.playerName;
        this.isShooting = options.isShooting ?? false;
        this.isSlipping = options.isOnIce ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSmokeTime = options.lastSmokeSpawnTime ?? 0;
        this.lastSlippingTime = options.lastSlippingTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
        this.color = options.color ?? [231, 156, 33];
        this.health = options.health ?? tierToMaxHealthMap[this.tier];
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
            health: this.health,
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

        if (options.lastSmokeSpawnTime !== undefined) {
            this.lastSmokeTime = options.lastSmokeSpawnTime;
        }

        if (options.bulletIds !== undefined) {
            this.bulletIds = options.bulletIds;
        }

        if (options.color !== undefined) {
            this.color = options.color;
        }

        if (options.health !== undefined) {
            this.health = options.health;
        }
    }

    get maxHealth(): number {
        return tierToMaxHealthMap[this.tier];
    }

    get smokeTime(): number | undefined {
        if (this.health === this.maxHealth) {
            return undefined;
        }

        return tierHealthToSmokeTime.get(this.health);
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
        return tierToBulletSpeedMap[this.tier] + this.movementSpeed;
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
        ];
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return {
            isMoving: this.isMoving,
        };
    }
}
