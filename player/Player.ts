import { Direction } from '@/physics/Direction';
import ButtonPressAction, { ButtonType } from '../actions/ButtonPressAction';

export interface PlayerOptions {
    id: string;
    tankId?: number;
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
    disconnected = false;
    isOwnPlayer = false;
    tankId?: number;
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
