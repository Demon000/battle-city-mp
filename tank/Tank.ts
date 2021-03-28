import GameObjectProperties from '@/object/GameObjectProperties';
import { ISprite } from '@/object/IGameObjectProperties';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';
import { TankTier } from './TankTier';

const tierToSpeedMap = {
    [TankTier.PLAYER_TIER_1]: 16,
    [TankTier.PLAYER_TIER_2]: 24,
    [TankTier.PLAYER_TIER_3]: 24,
    [TankTier.PLAYER_TIER_4]: 24,
};

const tierToBulletSpeedMap = {
    [TankTier.PLAYER_TIER_1]: 24,
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

export interface TankOptions extends GameObjectOptions {
    tier?: TankTier;
    playerId?: string;
    isShooting?: boolean;
}

export default class Tank extends GameObject {
    tier: TankTier;
    playerId?: string;
    isShooting: boolean;

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier ?? TankTier.PLAYER_TIER_1;
        this.playerId = options.playerId;
        this.isShooting = options.isShooting ?? false;
    }

    toOptions(): TankOptions {
        const gameObjectOptiions = super.toOptions();
        return Object.assign(gameObjectOptiions, {
            tier: this.tier,
            playerId: this.playerId,
        });
    }

    setOptions(other: Tank): void {
        super.setOptions(other);
        this.tier = other.tier;
        this.playerId = other.playerId;
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

    get sprite(): ISprite | undefined {
        if (this.requestedSpeed) {
            return GameObjectProperties.findAnimationSprite(this);
        } else {
            return GameObjectProperties.findSprite(this);
        }
    }
}
