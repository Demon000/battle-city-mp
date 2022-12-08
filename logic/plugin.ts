import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { CollisionService } from '@/physics/collisions/CollisionService';
import { GameModeService } from '@/services/GameModeService';

export interface PluginContext {
    registry: Registry;
    entityFactory: EntityFactory;
    collisionService: CollisionService;
    gameModeService: GameModeService;
}
