import { Entity } from '@/ecs/Entity';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { Point } from '@/physics/point/Point';

export function createSpawnEffect(
    entityFactory: EntityFactory,
    position: Point,
): Entity {
    return entityFactory.buildFromOptions({
        type: EntityType.SPAWN_EFFECT,
        components: {
            PositionComponent: position,
        },
    });
}
