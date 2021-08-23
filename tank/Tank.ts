import { HealthComponent } from '@/components/HealthComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { Color } from '@/drawable/Color';
import { Registry } from '@/ecs/Registry';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObject, GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

export interface TankTierProperties {
    bulletSpeed: number;
    maxBullets: number;
    bulletCooldown: number;
    bulletPower: string;
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
    lastBulletShotTime?: number;
    lastSmokeTime?: number;
    bulletIds?: number[];
    teamId?: string | null;
    flagTeamId?: string | null;
    flagColor?: Color | null;
    flagSourceId?: number | null;
}

export type PartialTankOptions = Partial<TankOptions>;

export class Tank extends GameObject {
    protected _flagColor: Color | null;

    tier: TankTier;
    playerId: string;
    playerName: string;
    isShooting: boolean;
    lastBulletShotTime: number;
    lastSmokeTime: number;
    bulletIds: number[];
    teamId: string | null;
    flagTeamId: string | null;
    flagSourceId: number | null;
    properties: TankProperties;

    constructor(options: TankOptions, properties: TankProperties, registry: Registry) {
        options.type = GameObjectType.TANK;

        super(options, properties, registry);

        this.properties = properties;
        this.tier = options.tier;
        this.playerId = options.playerId;
        this.playerName = options.playerName;
        this.isShooting = options.isShooting ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.lastSmokeTime = options.lastSmokeTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
        this.teamId = options.teamId ?? null;
        this.flagTeamId = options.flagTeamId ?? null;
        this._flagColor = options.flagColor ?? null;
        this.flagSourceId = options.flagSourceId ?? null;
    }

    toOptions(): TankOptions {
        return {
            ...super.toOptions(),
            tier: this.tier,
            playerId: this.playerId,
            playerName: this.playerName,
            lastBulletShotTime: this.lastBulletShotTime,
            bulletIds: this.bulletIds,
            teamId: this.teamId,
            flagColor: this.flagColor,
        };
    }

    setOptions(options: PartialTankOptions): void {
        super.setOptions(options);

        if (options.tier !== undefined) this.tier = options.tier;
        if (options.playerId !== undefined) this.playerId = options.playerId;
        if (options.playerName !== undefined) this.playerName = options.playerName;
        if (options.lastBulletShotTime !== undefined) this.lastBulletShotTime = options.lastBulletShotTime;
        if (options.lastSmokeTime !== undefined) this.lastSmokeTime = options.lastSmokeTime;
        if (options.bulletIds !== undefined) this.bulletIds = options.bulletIds;
        if (options.teamId !== undefined) this.teamId = options.teamId;
        if (options.flagColor !== undefined) this.flagColor = options.flagColor;
    }

    get tierProperties(): TankTierProperties {
        return this.properties.tiers[this.tier];
    }

    get smokeTime(): number | undefined {
        const healthComponent = this.getComponent(HealthComponent);
        if (healthComponent.value === healthComponent.max) {
            return undefined;
        }

        return this.properties.healthSmokeTime[healthComponent.value];
    }

    get bulletSpeed(): number {
        const movementComponent = this.getComponent(MovementComponent);
        return this.tierProperties.bulletSpeed + movementComponent.speed;
    }

    get bulletPower(): string {
        return this.tierProperties.bulletPower;
    }

    get maxBullets(): number {
        return this.tierProperties.maxBullets;
    }

    get bulletCooldown(): number {
        return this.tierProperties.bulletCooldown;
    }

    get flagColor(): Color | null {
        return this._flagColor;
    }

    set flagColor(value: Color | null) {
        this._flagColor = value;
        this.markGraphicsDirty();
    }
}
