import { EntityBuildOptions } from '@/entity/EntityFactory';
import { PlayerOptions } from '@/player/Player';
import { TeamOptions } from '@/team/Team';

export interface GameServerStatus {
    playersOptions: Iterable<PlayerOptions>;
    entitiesOptions: Iterable<EntityBuildOptions>;
    teamsOptions: Iterable<TeamOptions> | undefined;
    configsData: Record<string, any>;
}
