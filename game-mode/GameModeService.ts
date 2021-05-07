import { IGameModeProperties } from '@/game-mode/IGameModeProperties';

export default class GameModeService {
    private gameModesProperties;
    private gameMode?: string;

    constructor(gameModesProperties: Record<string, IGameModeProperties>) {
        this.gameModesProperties = gameModesProperties;
    }

    setGameMode(gameMode: string): void {
        if (this.gameModesProperties[gameMode] === undefined) {
            throw new Error(`Cannot find properties for game mode: ${gameMode}`);
        }
        this.gameMode = gameMode;
    }

    getGameMode(): string | undefined {
        return this.gameMode;
    }

    getGameModeProperties(): IGameModeProperties {
        if (this.gameMode === undefined) {
            throw new Error('Cannot find properties for undefined game mode');
        }

        const properties = this.gameModesProperties[this.gameMode];
        if (properties === undefined) {
            throw new Error(`Cannot find properties for game mode: ${this.gameMode}`);
        }

        return properties;
    }
}
