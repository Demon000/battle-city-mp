import { Color } from '@/drawable/Color';

export interface TeamOptions {
    id: string;
    color: Color;
    playerIds: string[];
}

export type PartialTeamOptions = Partial<TeamOptions>;

export default class Team {
    id: string;
    color: Color;
    playerIds: string[];

    constructor(options: TeamOptions) {
        this.id = options.id;
        this.color = options.color;
        this.playerIds = options.playerIds ?? [];
    }

    get playersCount(): number {
        return this.playerIds.length;
    }

    toOptions(): TeamOptions {
        return {
            id: this.id,
            color: this.color,
            playerIds: this.playerIds,
        };
    }

    setOptions(options: TeamOptions): void {
        this.color = options.color ?? this.color;
        this.playerIds = options.playerIds ?? this.playerIds;
    }
}