import { GameModeComponent, GameModeTypes } from '@/components/GameModeComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityIds } from '@/entity/EntityIds';
import { EntityType } from '@/entity/EntityType';

export function getGameModeProperties(registry: Registry): GameModeComponent {
    const entity = registry.getEntityById(EntityIds.GAME_MODE);
    return entity.getComponent(GameModeComponent);
}

export function setGameMode(
    entityFactory: EntityFactory,
    type: GameModeTypes,
): Entity {
    return entityFactory.buildFromOptions({
        type: EntityType.GAME_MODE,
        subtypes: [type],
        id: EntityIds.GAME_MODE,
    });
}

export function isIgnoredEntityType(
    registry: Registry,
    type: EntityType,
): boolean {
    const gameMode = getGameModeProperties(registry);

    return gameMode.ignoredEntityTypes.includes(type);
}
