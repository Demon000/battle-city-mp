import { HealthComponent } from '@/components/HealthComponent';
import { Color } from '@/drawable/Color';
import { Entity } from '@/ecs/Entity';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';

export function createTankForPlayer(
    entityFactory: EntityFactory,
    player: Player,
    position: Point,
    color: Color,
): Entity {
    return entityFactory.buildFromOptions({
        type: EntityType.TANK,
        subtypes: [player.requestedTankTier],
        components: {
            TeamOwnedComponent: {
                teamId: player.teamId,
            },
            PlayerOwnedComponent: {
                playerId: player.id,
                playerName: player.displayName,
            },
            PositionComponent: position,
            ColorComponent: {
                value: color,
            },
        },
    });
}

export function decreaseTankHealth(tank: Entity, value: number): void {
    const health = tank.getComponent(HealthComponent);
    health.update({
        value: health.value - value,
    });
}
