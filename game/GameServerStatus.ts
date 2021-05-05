import { GameObjectOptions } from '@/object/GameObject';
import { PlayerOptions } from '@/player/Player';
import { TeamOptions } from '@/team/Team';

export interface GameServerStatus {
    playersOptions: Iterable<PlayerOptions>;
    objectsOptions: Iterable<GameObjectOptions>;
    teamsOptions: Iterable<TeamOptions> | undefined;
    tps: number;
}
