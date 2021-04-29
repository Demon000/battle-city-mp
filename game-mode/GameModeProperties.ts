import { GameModeType } from './GameModeType';
import { IGameModeProperties } from './IGameModeProperties';

const gameModeProperties: Record<GameModeType, IGameModeProperties> = {
    [GameModeType.DEATHMATCH]: {
        hasTeams: false,
    },
    [GameModeType.TEAM_DEATHMATCH]: {
        hasTeams: true,
        friendlyFire: false,
    },
};

export class GameModeProperties {
    static getTypeProperties(type: GameModeType): IGameModeProperties {
        return gameModeProperties[type];
    }
}
