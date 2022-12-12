import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/subtypes/TankTier';

export interface PlayerComponentData {
    lastRequestedDirection: Direction | undefined;
    isShooting: boolean;
    deaths: number;
    kills: number;
    points: number;
    requestedTankTier: TankTier;
}

export class PlayerComponent extends Component
    implements PlayerComponentData {
    static TAG = 'PL';

    lastRequestedDirection = undefined;
    isShooting = false;
    deaths = 0;
    kills = 0;
    points = 0;
    requestedTankTier = TankTier.NORMAL;
}
