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
    requestedTankTier?: TankTier;
    requestedTankColor?: Color;
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
    requestedTankTier: TankTier;
    requestedTankColor: Color;
    disconnected = false;
    tankId: number | null;
    teamId: string | null;
    id: string;
    name?: string;
    kills: number;
    deaths: number;
    points: number;
    mapEditorEnabled: boolean;

    constructor(options: PlayerOptions) {
        this.id = options.id;
        this.tankId = options.tankId;
        this.teamId = options.teamId;
        this.name = options.name;
        this.kills = options.kills ?? 0;
        this.deaths = options.deaths ?? 0;
        this.points = options.points ?? 0;
        this.mapEditorEnabled = false;
        this.requestedTankTier = options.requestedTankTier ?? TankTier.NORMAL;
        this.requestedTankColor = options.requestedTankColor ?? [231, 156, 33];
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
            requestedTankColor: this.requestedTankColor,
            requestedTankTier: this.requestedTankTier,
        };
    }

    setOptions(options: PartialPlayerOptions): void {
        if (options.tankId !== undefined) this.tankId = options.tankId;
        if (options.teamId !== undefined) this.teamId = options.teamId;
        if (options.name !== undefined) this.name = options.name;
        if (options.kills !== undefined) this.kills = options.kills;
        if (options.deaths !== undefined) this.deaths = options.deaths;
        if (options.points !== undefined) this.points = options.points;
        if (options.requestedTankTier !== undefined) this.requestedTankTier = options.requestedTankTier;
        if (options.requestedTankColor !== undefined) this.requestedTankColor = options.requestedTankColor;
    }
}
