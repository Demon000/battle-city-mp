import { BulletPower } from '@/bullet/BulletPower';
import { Color } from '@/drawable/Color';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import ObjectUtils from '@/utils/ObjectUtils';
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
    flagTeamId?: string | null;
    flagColor?: Color | null;
}

export type PartialTankOptions = Partial<TankOptions>;

export default class Tank extends GameObject {
    tier: TankTier;
    playerId: string;
    playerName: string;
    isShooting: boolean;
    isOnIce: boolean;
    isOnSand: boolean;
    isUnderBush: boolean;
    lastBulletShotTime: number;
    lastSmokeTime: number;
    bulletIds: number[];
    color: Color;
    health: number;
    flagTeamId: string | null;
    flagColor: Color | null;

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
        this.flagTeamId = options.flagTeamId ?? null;
        this.flagColor = options.flagColor ?? null;
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
        ObjectUtils.keysAssign(this, [
            'tier',
            'playerId',
            'playerName',
            'isShooting',
            'isOnIce',
            'isOnSand',
            'isUnderBush',
            'lastBulletShotTime',
            'lastSmokeTime',
            'bulletIds',
            'color',
            'health',
        ], options);
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
        const metas: ResourceMeta[] = [{
            isTank: true,
            direction: this.direction,
            isMoving: this.isMoving,
            tier: this.tier,
        }];

        if (!this.isUnderBush) {
            metas.push({
                isText: true,
            });
        }

        if (this.flagColor) {
            metas.push(
                {
                    isFlagPole: true,
                },
                {
                    isFlagCloth: true,
                    color: this.flagColor,
                },
            );
        }

        return metas;
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return {
            isMoving: this.isMoving,
        };
    }
}
