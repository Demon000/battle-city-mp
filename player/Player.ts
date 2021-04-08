import { Color } from '@/drawable/Color';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/tank/TankTier';
import ButtonPressAction, { ButtonType } from '../actions/ButtonPressAction';

export interface PlayerOptions {
    id: string;
    tankId: number | null;
}

export enum PlayerSpawnStatus {
    NONE = 'none',
    SPAWN = 'spawn',
    DESPAWN = 'despawn',
}

export default class Player {
    map = new Map<ButtonType, ButtonPressAction>();
    lastRequestedDirection: Direction | undefined;
    lastIsShooting = false;
    requestedSpawnStatus = PlayerSpawnStatus.NONE;
    requestedGameObjects = false;
    requestedPlayers = false;
    requestedTankTier = TankTier.LIGHT;
    requestedTankColor?: Color;
    disconnected = false;
    isOwnPlayer = false;
    tankId: number | null;
    id: string;

    constructor(options: PlayerOptions) {
        this.id = options.id;
        this.tankId = options.tankId;
    }

    toOptions(): PlayerOptions {
        return {
            id: this.id,
            tankId: this.tankId,
        };
    }

    setOptions(options: PlayerOptions): void {
        this.tankId = options.tankId;
    }
}
