import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { Entity } from '@/ecs/Entity';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { Point } from '@/physics/point/Point';
import { ExplosionType } from '@/subtypes/ExplosionType';

export function createExplosion(
    entityFactory: EntityFactory,
    sourceOrPosition: Entity | Point,
    type: ExplosionType,
    destroyedType?: string,
): Entity {
    let position;

    if (sourceOrPosition instanceof Entity) {
        position = sourceOrPosition.getComponent(CenterPositionComponent);
    } else {
        position = sourceOrPosition;
    }

    return entityFactory.buildFromOptions({
        type: EntityType.EXPLOSION,
        subtypes: [type],
        components: {
            PositionComponent: position,
            ExplosionComponent: {
                destroyedType,
            },
        },
    });
};
