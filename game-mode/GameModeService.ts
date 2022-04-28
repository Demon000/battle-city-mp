import { Config } from '@/config/Config';
import { IGameModeProperties } from '@/game-mode/IGameModeProperties';
import { assert } from '@/utils/assert';

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

    getGameModeProperties(): IGameModeProperties {
        assert(this.gameMode !== undefined,
            'Cannot find properties for undefined game mode');

        return this.config.get<IGameModeProperties>('game-modes-properties', this.gameMode);
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
