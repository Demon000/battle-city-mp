import { PlayerOptions } from '@/player/Player';
import { TeamOptions } from '@/team/Team';

export interface GameServerStatus {
    playersOptions: Iterable<PlayerOptions>;
    teamsOptions: Iterable<TeamOptions> | undefined;
    configsData: Record<string, any>;
}
