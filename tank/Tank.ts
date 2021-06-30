import { BulletPower } from '@/bullet/BulletPower';
import { Color } from '@/drawable/Color';
import { GameObjectProperties } from '@/object/GameObjectProperties';
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

export interface TankProperties extends GameObjectProperties {
    tiers: Record<TankTier, TankTierProperties>;
    healthSmokeTime: Record<number, number>,
}

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
    properties: TankProperties;

    constructor(options: TankOptions, properties: TankProperties) {
        options.type = GameObjectType.TANK;

        super(options, properties);

        this.properties = properties;
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
        return this.properties.tiers[this.tier];
    }

    get maxHealth(): number {
        return this.tierProperties.maxHealth;
    }

    get smokeTime(): number | undefined {
        if (this.health === this.maxHealth) {
            return undefined;
        }

        return this.properties.healthSmokeTime[this.health];
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
        this.markGraphicsDirty();
    }

    get flagColor(): Color | null {
        return this._flagColor;
    }

    set flagColor(value: Color | null) {
        this._flagColor = value;
        this.markGraphicsDirty();
    }

    get isMoving(): boolean {
        return super.isMoving;
    }

    set isMoving(value: boolean) {
        super.isMoving = value;
        this.markGraphicsDirty();
        this.updateAudioMeta();
    }

    get direction(): Direction {
        return super.direction;
    }

    set direction(value: Direction) {
        super.direction = value;
        this.markGraphicsDirty();
    }

    protected updateAudioMeta(): void {
        this._audioMeta = {
            isMoving: this.isMoving,
        };
    }
}
