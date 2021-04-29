import { Color } from '@/drawable/Color';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/tank/TankTier';
import ButtonPressAction, { ButtonType } from '../actions/ButtonPressAction';

export interface PlayerOptions {
    id: string;
    tankId: number | null;
    teamId: string | null;
    name?: string;
    deaths?: number;
    kills?: number;
    points?: number;
}

export type PartialPlayerOptions = Partial<PlayerOptions>;

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
    tankId: number | null;
    teamId: string | null;
    id: string;
    name?: string;
    kills: number;
    deaths: number;
    points: number;

    constructor(options: PlayerOptions) {
        this.id = options.id;
        this.tankId = options.tankId;
        this.teamId = options.teamId;
        this.name = options.name;
        this.kills = options.kills ?? 0;
        this.deaths = options.deaths ?? 0;
        this.points = options.points ?? 0;
    }

    get displayName(): string {
        return this.name ?? this.id;
    }

    toOptions(): PlayerOptions {
        return {
            id: this.id,
            tankId: this.tankId,
            teamId: this.teamId,
            name: this.name,
            kills: this.kills,
            deaths: this.deaths,
            points: this.points,
        };
    }

    setOptions(options: PartialPlayerOptions): void {
        this.tankId = options.tankId ?? this.tankId;
        this.name = options.name ?? this.name;
        this.kills = options.kills ?? this.kills;
        this.deaths = options.deaths ?? this.deaths;
        this.points = options.points ?? this.points;
    }
}
