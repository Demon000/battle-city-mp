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
    requestedSpawnStatus = PlayerSpawnStatus.NONE;
    spawnStatus = PlayerSpawnStatus.NONE;
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
