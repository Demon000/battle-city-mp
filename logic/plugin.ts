import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { GameEventBatcher } from '@/game/GameEventBatcher';
import { CollisionService } from '@/physics/collisions/CollisionService';
import { GameModeService } from '@/services/GameModeService';

export interface PluginContext {
    batcher: GameEventBatcher,
    registry: Registry;
    entityFactory: EntityFactory;
    collisionService: CollisionService;
    gameModeService: GameModeService;
}
