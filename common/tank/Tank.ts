import GameObject, { GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectProperties';

enum TankTier {
    PLAYER_TIER_1 = 'player-tier-1',
    PLAYER_TIER_2 = 'player-tier-2',
    PLAYER_TIER_3 = 'player-tier-3',
    PLAYER_TIER_4 = 'player-tier-4',
}

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
}

export default class Tank extends GameObject {
    tier: TankTier;

    constructor(options: TankOptions) {
        options.type = GameObjectType.TANK;

        super(options);

        this.tier = options.tier ?? TankTier.PLAYER_TIER_1;
    }

    get speed(): number {
        return tierToSpeedMap[this.tier];
    }

    get bulletSpeed(): number {
        return tierToBulletSpeedMap[this.tier];
    }

    get maxBullets(): number {
        return tierToMaxBulletsMap[this.tier];
    }
}
