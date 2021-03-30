import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

const tierToSpeedMap = {
    [TankTier.PLAYER_TIER_1]: 32,
    [TankTier.PLAYER_TIER_2]: 24,
    [TankTier.PLAYER_TIER_3]: 24,
    [TankTier.PLAYER_TIER_4]: 24,
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

export interface TankOptions extends GameObjectOptions {
    tier?: TankTier;
    playerId?: string;
    isShooting?: boolean;
    lastBulletShotTime?: number;
    bulletIds?: number[];
}

export default class Tank extends GameObject {
    tier: TankTier;
    playerId?: string;
    isShooting: boolean;
    lastBulletShotTime: number;
    bulletIds: number[];

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier ?? TankTier.PLAYER_TIER_1;
        this.playerId = options.playerId;
        this.isShooting = options.isShooting ?? false;
        this.lastBulletShotTime = options.lastBulletShotTime ?? 0;
        this.bulletIds = options.bulletIds ?? new Array<number>();
    }

    toOptions(): TankOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            tier: this.tier,
            playerId: this.playerId,
            lastBulletShotTime: this.lastBulletShotTime,
            bulletIds: this.bulletIds,
        });
    }

    setOptions(other: Tank): void {
        super.setOptions(other);
        this.tier = other.tier;
        this.playerId = other.playerId;
        this.lastBulletShotTime = other.lastBulletShotTime;
        this.bulletIds = other.bulletIds;
    }

    get movementSpeed(): number {
        return tierToSpeedMap[this.tier];
    }

    get bulletSpeed(): number {
        return tierToBulletSpeedMap[this.tier];
    }

    get maxBullets(): number {
        return tierToMaxBulletsMap[this.tier];
    }

    get bulletCooldown(): number {
        return tierToBulletCooldownMap[this.tier];
    }

    isMatchingMeta(meta: ResourceMeta): boolean {
        if (meta.isMoving === true && this.requestedSpeed > 0) {
            return true;
        }

        return false;
    }
}
