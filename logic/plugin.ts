import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { CollisionService } from '@/physics/collisions/CollisionService';
import { PlayerService } from '@/player/PlayerService';
import { GameModeService } from '@/services/GameModeService';
import { TeamService } from '@/team/TeamService';

export interface PluginContext {
    registry: Registry;
    entityFactory: EntityFactory;
    playerService: PlayerService;
    collisionService: CollisionService;
    gameModeService: GameModeService;
    teamService: TeamService;
}
