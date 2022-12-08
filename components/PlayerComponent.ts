import { Component } from '@/ecs/Component';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/subtypes/TankTier';

export enum PlayerSpawnStatus {
    SPAWN = 'spawn',
    DESPAWN = 'despawn',
}

export interface PlayerComponentData {
    name: string;
    deaths: number;
    kills: number;
    points: number;
    requestedTankTier: TankTier;
    respawnTimeout: number;
    disconnected: boolean;
}

export class PlayerComponent
    extends Component<PlayerComponent>
    implements PlayerComponentData {
    static TAG = 'PL';

    lastRequestedDirection: Direction | undefined;
    isShooting = false;
    name = '';
    deaths = 0;
    kills = 0;
    points = 0;
    requestedTankTier = TankTier.NORMAL;
    respawnTimeout = 0;
    disconnected = false;
}
