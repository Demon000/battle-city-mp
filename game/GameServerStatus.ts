import { GameObjectOptions } from '@/object/GameObject';
import { PlayerOptions } from '@/player/Player';
import { TeamOptions } from '@/team/Team';

export interface GameServerStatus {
    playersOptions: PlayerOptions[];
    objectsOptions: GameObjectOptions[];
    teamsOptions: TeamOptions[] | undefined;
    tps: number;
}
