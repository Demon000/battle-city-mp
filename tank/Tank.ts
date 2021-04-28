import { BulletPower } from '@/bullet/BulletPower';
import { Color } from '@/drawable/Color';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

export interface ITankTierProperties {
    maxSpeed: number;
    accelerationFactor: number;
    decelerationFactor: number;
    bulletSpeed: number;
    maxBullets: number;
    bulletCooldown: number;
    bulletPower: BulletPower;
    sandMaxSpeedFactor: number;
    sandAccelerationFactor: number;
    sandDecelerationFactor: number;
    iceMaxSpeedFactor: number;
    iceAccelerationFactor: number;
    iceDecelerationFactor: number;
    maxHealth: number;
}

const tierToPropertiesMap: Record<TankTier, ITankTierProperties> = {
    [TankTier.NORMAL]: {
        maxSpeed: 114,
        accelerationFactor: 3,
        decelerationFactor: 3,
        bulletSpeed: 128,
        maxBullets: 3,
        bulletCooldown: 250,
        bulletPower: BulletPower.LIGHT,
        sandMaxSpeedFactor: 0.5,
        sandAccelerationFactor: 1,
        sandDecelerationFactor: 2,
        iceMaxSpeedFactor: 1.5,
        iceAccelerationFactor: 2,
        iceDecelerationFactor: 0.5,
        maxHealth: 2,
    },
    [TankTier.LIGHT]: {
        maxSpeed: 128,
        accelerationFactor: 2,
        bulletSpeed: 128,
        decelerationFactor: 2,
        maxBullets: 2,
        bulletCooldown: 250,
        bulletPower: BulletPower.LIGHT,
        sandMaxSpeedFactor: 0.25,
        sandAccelerationFactor: 1,
        sandDecelerationFactor: 2,
        iceMaxSpeedFactor: 1.5,
        iceAccelerationFactor: 2,
        iceDecelerationFactor: 0.5,
        maxHealth: 1,
    },
    [TankTier.HEAVY]: {
        maxSpeed: 96,
        accelerationFactor: 1,
        bulletSpeed: 128,
        decelerationFactor: 1,
        maxBullets: 1,
        bulletCooldown: 500,
        bulletPower: BulletPower.HEAVY,
        sandMaxSpeedFactor: 1,
        sandAccelerationFactor: 1,
        sandDecelerationFactor: 2,
        iceMaxSpeedFactor: 1.5,
        iceAccelerationFactor: 2,
        iceDecelerationFactor: 0.5,
        maxHealth: 3,
    },
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
    isOnSand?: boolean;
    isUnderBush?: boolean;
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
    isOnIce?: boolean;
    isOnSand?: boolean;
    isUnderBush?: boolean;
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
        this.isOnIce = options.isOnIce ?? false;
        this.isOnSand = options.isOnSand ?? false;
        this.isUnderBush = options.isUnderBush ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSmokeTime = options.lastSmokeTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
        this.color = options.color ?? [231, 156, 33];
        this.health = options.health ?? this.maxHealth;
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
        this.isShooting = options.isShooting ?? this.isShooting;
        this.isOnIce = options.isOnIce ?? this.isOnIce;
        this.isOnSand = options.isOnSand ?? this.isOnSand;
        this.isUnderBush = options.isUnderBush ?? this.isUnderBush;
        this.lastBulletShotTime = options.lastBulletShotTime ?? this.lastBulletShotTime;
        this.lastSmokeTime = options.lastSmokeTime ?? this.lastSmokeTime;
        this.bulletIds = options.bulletIds ?? this.bulletIds;
        this.color = options.color ?? this.color;
        this.health = options.health ?? this.health;
    }

    get tierProperties(): ITankTierProperties {
        return tierToPropertiesMap[this.tier];
    }

    get maxHealth(): number {
        return this.tierProperties.maxHealth;
    }

    get smokeTime(): number | undefined {
        if (this.health === this.maxHealth) {
            return undefined;
        }

        return tierHealthToSmokeTime.get(this.health);
    }

    get maxMovementSpeed(): number {
        let speed = this.tierProperties.maxSpeed;

        if (this.isOnIce) {
            speed *= this.tierProperties.iceMaxSpeedFactor;
        }

        if (this.isOnSand) {
            speed *= this.tierProperties.sandMaxSpeedFactor;
        }

        return speed;
    }

    get accelerationFactor(): number {
        let factor = this.tierProperties.accelerationFactor;

        if (this.isOnIce) {
            factor *= this.tierProperties.iceAccelerationFactor;
        }

        if (this.isOnSand) {
            factor *= this.tierProperties.sandAccelerationFactor;
        }

        return factor;
    }

    get decelerationFactor(): number {
        let factor = this.tierProperties.decelerationFactor;

        if (this.isOnIce) {
            factor *= this.tierProperties.iceDecelerationFactor;
        }

        if (this.isOnSand) {
            factor *= this.tierProperties.sandDecelerationFactor;
        }

        return factor;
    }

    get bulletSpeed(): number {
        return this.tierProperties.bulletSpeed + this.movementSpeed;
    }

    get bulletPower(): BulletPower {
        return this.tierProperties.bulletPower;
    }

    get maxBullets(): number {
        return this.tierProperties.maxBullets;
    }

    get bulletCooldown(): number {
        return this.tierProperties.bulletCooldown;
    }

    get graphicsMeta(): ResourceMeta[] | undefined | null {
        const tankGraphicsMeta = {
            isTank: true,
            direction: this.direction,
            isMoving: this.isMoving,
            tier: this.tier,
        };

        const textGraphicsMeta = {
            isText: true,
        };

        const metas: ResourceMeta[] = [tankGraphicsMeta];

        if (!this.isUnderBush) {
            metas.push(textGraphicsMeta);
        }

        return metas;
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return {
            isMoving: this.isMoving,
        };
    }
}
