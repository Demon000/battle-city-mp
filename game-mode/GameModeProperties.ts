import { GameModeType } from './GameModeType';
import { IGameModeProperties, SameTeamBulletHitMode } from './IGameModeProperties';

const gameModeProperties: Record<GameModeType, IGameModeProperties> = {
    [GameModeType.DEATHMATCH]: {
        hasTeams: false,
        sameTeamBulletHitMode: SameTeamBulletHitMode.ALLOW,
    },
    [GameModeType.TEAM_DEATHMATCH]: {
        hasTeams: true,
        sameTeamBulletHitMode: SameTeamBulletHitMode.DESTROY,
    },
};

export class GameModeProperties {
    static getTypeProperties(type: GameModeType): IGameModeProperties {
        return gameModeProperties[type];
    }
}
