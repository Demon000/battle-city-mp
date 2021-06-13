import { BulletPower } from '@/bullet/BulletPower';
import { Color } from '@/drawable/Color';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Direction } from '@/physics/Direction';
import { GameObject, GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

export interface TankTierProperties {
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

export const tierToPropertiesMap: Record<TankTier, TankTierProperties> = {
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
        bulletSpeed: 192,
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
    teamId?: string | null;
    color: Color;
    health?: number;
    flagTeamId?: string | null;
    flagColor?: Color | null;
    flagSourceId?: number | null;
}

export type PartialTankOptions = Partial<TankOptions>;

export class Tank extends GameObject {
    protected _isUnderBush: boolean;
    protected _flagColor: Color | null;

    tier: TankTier;
    playerId: string;
    playerName: string;
    isShooting: boolean;
    isOnIce: boolean;
    isOnSand: boolean;
    lastBulletShotTime: number;
    lastSmokeTime: number;
    bulletIds: number[];
    teamId: string | null;
    color: Color;
    health: number;
    flagTeamId: string | null;
    flagSourceId: number | null;

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier;
        this.playerId = options.playerId;
        this.playerName = options.playerName;
        this.isShooting = options.isShooting ?? false;
        this.isOnIce = options.isOnIce ?? false;
        this.isOnSand = options.isOnSand ?? false;
        this._isUnderBush = options.isUnderBush ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSmokeTime = options.lastSmokeTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
        this.teamId = options.teamId ?? null;
        this.color = options.color;
        this.health = options.health ?? this.maxHealth;
        this.flagTeamId = options.flagTeamId ?? null;
        this._flagColor = options.flagColor ?? null;
        this.flagSourceId = options.flagSourceId ?? null;
    }

    toOptions(): TankOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            tier: this.tier,
            playerId: this.playerId,
            playerName: this.playerName,
            lastBulletShotTime: this.lastBulletShotTime,
            bulletIds: this.bulletIds,
            teamId: this.teamId,
            color: this.color,
            health: this.health,
            flagColor: this.flagColor,
        });
    }

    setOptions(options: PartialTankOptions): void {
        super.setOptions(options);

        if (options.tier !== undefined) this.tier = options.tier;
        if (options.playerId !== undefined) this.playerId = options.playerId;
        if (options.playerName !== undefined) this.playerName = options.playerName;
        if (options.isUnderBush !== undefined) this.isUnderBush = options.isUnderBush;
        if (options.lastBulletShotTime !== undefined) this.lastBulletShotTime = options.lastBulletShotTime;
        if (options.lastSmokeTime !== undefined) this.lastSmokeTime = options.lastSmokeTime;
        if (options.bulletIds !== undefined) this.bulletIds = options.bulletIds;
        if (options.teamId !== undefined) this.teamId = options.teamId;
        if (options.color !== undefined) this.color = options.color;
        if (options.health !== undefined) this.health = options.health;
        if (options.flagColor !== undefined) this.flagColor = options.flagColor;
    }

    get tierProperties(): TankTierProperties {
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

    get isUnderBush(): boolean {
        return this._isUnderBush;
    }

    set isUnderBush(value: boolean) {
        this._isUnderBush = value;
        this.markGraphicsMetaUpdated();
    }

    get flagColor(): Color | null {
        return this._flagColor;
    }

    set flagColor(value: Color | null) {
        this._flagColor = value;
        this.markGraphicsMetaUpdated();
    }

    get isMoving(): boolean {
        return super.isMoving;
    }

    set isMoving(value: boolean) {
        super.isMoving = value;
        this.markGraphicsMetaUpdated();
        this.updateAudioMeta();
    }

    get direction(): Direction {
        return super.direction;
    }

    set direction(value: Direction) {
        super.direction = value;
        this.markGraphicsMetaUpdated();
    }

    protected updateGraphicsMeta(): void {
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

        this._graphicsMeta = metas;
    }

    protected updateAudioMeta(): void {
        this._audioMeta = {
            isMoving: this.isMoving,
        };
    }
}
