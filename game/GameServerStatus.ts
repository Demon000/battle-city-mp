import { ComponentInitialization } from '@/ecs/Component';
import { GameObjectOptions } from '@/object/GameObject';
import { PlayerOptions } from '@/player/Player';
import { TeamOptions } from '@/team/Team';

export interface GameServerStatus {
    playersOptions: Iterable<PlayerOptions>;
    objectsOptions: Iterable<[GameObjectOptions, ComponentInitialization[]]>;
    teamsOptions: Iterable<TeamOptions> | undefined;
    configsData: Record<string, any>;
}
