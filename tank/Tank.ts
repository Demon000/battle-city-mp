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

const tierToSandMaxSpeedFactorMap = {
    [TankTier.NORMAL]: 0.5,
    [TankTier.LIGHT]: 0.25,
    [TankTier.HEAVY]: 0.25,
};

const tierToSandAccelerationFactorMap = {
    [TankTier.NORMAL]: 1,
    [TankTier.LIGHT]: 1,
    [TankTier.HEAVY]: 1,
};

const tierToSandDecelrationFactorMap = {
    [TankTier.NORMAL]: 2,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 2,
};

const tierToIceMaxSpeedFactorMap = {
    [TankTier.NORMAL]: 1.5,
    [TankTier.LIGHT]: 1.5,
    [TankTier.HEAVY]: 1.5,
};

const tierToIceAccelerationFactorMap = {
    [TankTier.NORMAL]: 2,
    [TankTier.LIGHT]: 2,
    [TankTier.HEAVY]: 2,
};

const tierToIceDecelerationFactorMap = {
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
    lastBulletShotTime?: number;
    lastSmokeTime?: number;
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
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSmokeTime = options.lastSmokeTime ?? 0;
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
            lastBulletShotTime: this.lastBulletShotTime,
            bulletIds: this.bulletIds,
            color: this.color,
            health: this.health,
        });
    }

    setOptions(options: PartialTankOptions): void {
        super.setOptions(options);

        this.tier = options.tier ?? this.tier;
        this.playerId = options.playerId ?? this.playerId;
        this.playerName = options.playerName ?? this.playerName;
        this.lastBulletShotTime = options.lastBulletShotTime ?? this.lastBulletShotTime;
        this.lastSmokeTime = options.lastSmokeTime ?? this.lastSmokeTime;
        this.bulletIds = options.bulletIds ?? this.bulletIds;
        this.color = options.color ?? this.color;
        this.health = options.health ?? this.health;
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

    private isOnType(type: GameObjectType): boolean {
        if (this.collisionTracker === undefined) {
            return false;
        }

        return this.collisionTracker.isCollidingWithType(type);
    }

    private get isOnIce(): boolean {
        return this.isOnType(GameObjectType.ICE);
    }

    private get isOnSand(): boolean {
        return this.isOnType(GameObjectType.SAND);
    }

    get maxMovementSpeed(): number {
        let speed = tierToMaxSpeedMap[this.tier];

        if (this.isOnIce) {
            speed *= tierToIceMaxSpeedFactorMap[this.tier];
        }

        if (this.isOnSand) {
            speed *= tierToSandMaxSpeedFactorMap[this.tier];
        }

        return speed;
    }

    get accelerationFactor(): number {
        let factor = tierToAccelerationFactorMap[this.tier];

        if (this.isOnIce) {
            factor *= tierToIceAccelerationFactorMap[this.tier];
        }

        if (this.isOnSand) {
            factor *= tierToSandAccelerationFactorMap[this.tier];
        }

        return factor;
    }

    get decelerationFactor(): number {
        let factor = tierToDecelerationFactorMap[this.tier];

        if (this.isOnIce) {
            factor *= tierToIceDecelerationFactorMap[this.tier];
        }

        if (this.isOnSand) {
            factor *= tierToSandDecelrationFactorMap[this.tier];
        }

        return factor;
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
