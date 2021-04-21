import { Color } from '@/drawable/Color';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/tank/TankTier';
import ButtonPressAction, { ButtonType } from '../actions/ButtonPressAction';

export interface PlayerOptions {
    id: string;
    tankId: number | null;
    name?: string;
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
    requestedServerStatus = false;
    requestedTankTier = TankTier.LIGHT;
    requestedTankColor?: Color;
    disconnected = false;
    isOwnPlayer = false;
    tankId: number | null;
    id: string;
    name?: string;

    constructor(options: PlayerOptions) {
        this.id = options.id;
        this.tankId = options.tankId;
    }

    get displayName(): string {
        return this.name ?? this.id;
    }

    toOptions(): PlayerOptions {
        return {
            id: this.id,
            tankId: this.tankId,
            name: this.name,
        };
    }

    setOptions(options: PlayerOptions): void {
        this.tankId = options.tankId ?? this.tankId;
        this.name = options.name ?? this.name;
    }
}
