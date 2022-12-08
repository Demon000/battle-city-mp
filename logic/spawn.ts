import { PositionComponent } from '@/components/PositionComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';
import { Point } from '@/physics/point/Point';
import { assert } from '@/utils/assert';
import { Random } from '@/utils/Random';

export function pickRandomSpawnPosition(
    entities: Iterable<Entity>,
    teamId: EntityId | null,
): Point {
    const playerSpawnEntities = new Array<Entity>();

    for (const entity of entities) {
        const playerSpawnTeamId = entity
            .getComponent(TeamOwnedComponent).teamId;
        if (teamId === null || teamId === playerSpawnTeamId) {
            playerSpawnEntities.push(entity);
        }
    }

    const playerSpawnEntity = Random.getRandomArrayElement(playerSpawnEntities);
    assert(playerSpawnEntity !== undefined,
        'Failed to get random spawn entity');

    return playerSpawnEntity.getComponent(PositionComponent);
}
