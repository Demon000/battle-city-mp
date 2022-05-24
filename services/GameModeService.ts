import { Config } from '@/config/Config';
import { assert } from '@/utils/assert';

export enum SameTeamBulletHitMode {
    ALLOW = 'allow',
    PASS = 'pass',
    DESTROY = 'destroy',
}

export interface GameModeProperties {
    hasTeams: boolean;
    sameTeamBulletHitMode: SameTeamBulletHitMode;
    ignoredEntityTypes?: string[];
}

export type GameModesProperties = Record<string, GameModeProperties>;


export class GameModeService {
    private gameMode?: string;

    constructor(
        private config: Config,
    ) {}

    setGameMode(gameMode: string): void {
        this.gameMode = gameMode;
    }

    getGameMode(): string | undefined {
        return this.gameMode;
    }

    getGameModeProperties(): GameModeProperties {
        assert(this.gameMode !== undefined,
            'Cannot find properties for undefined game mode');

        return this.config.get<GameModeProperties>('game-modes-properties', this.gameMode);
    }

    isIgnoredEntityType(type: string | undefined): boolean {
        assert(type !== undefined,
            'Cannot check if undefined type is ignored');

        const gameModeProperties = this.getGameModeProperties();
        if (gameModeProperties.ignoredEntityTypes === undefined) {
            return true;
        }

        return !gameModeProperties.ignoredEntityTypes.includes(type);
    }
}
