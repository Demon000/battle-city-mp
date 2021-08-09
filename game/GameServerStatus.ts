import { GameObjectFactoryBuildOptions } from '@/object/GameObjectFactory';
import { PlayerOptions } from '@/player/Player';
import { TeamOptions } from '@/team/Team';

export interface GameServerStatus {
    playersOptions: Iterable<PlayerOptions>;
    objectsOptions: Iterable<GameObjectFactoryBuildOptions>;
    teamsOptions: Iterable<TeamOptions> | undefined;
    configsData: Record<string, any>;
}
