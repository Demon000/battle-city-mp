import { Config } from '@/config/Config';
import { IGameModeProperties } from '@/game-mode/IGameModeProperties';
import { GameObjectType } from '@/object/GameObjectType';

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

    isIgnoredObjectType(type: GameObjectType | undefined): boolean {
        if (type === undefined) {
            throw new Error(`Cannot check if type '${type}' is ignored`);
        }

        const gameModeProperties = this.getGameModeProperties();
        if (gameModeProperties.ignoredObjectTypes === undefined) {
            return true;
        }

        return !gameModeProperties.ignoredObjectTypes.includes(type);
    }
}
