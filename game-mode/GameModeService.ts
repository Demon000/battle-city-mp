import { Config } from '@/config/Config';
import { IGameModeProperties } from '@/game-mode/IGameModeProperties';

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
        if (this.gameMode === undefined) {
            throw new Error('Cannot find properties for undefined game mode');
        }

        return this.config.get<IGameModeProperties>('game-modes-properties', this.gameMode);
    }
}
