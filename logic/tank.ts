import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { Color } from '@/drawable/Color';
import { Entity } from '@/ecs/Entity';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { PluginContext } from '@/logic/plugin';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';
import { handleFlagInteraction } from './flag';

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

export function onTankCollideFlag(
    this: PluginContext,
    tank: Entity,
    flag: Entity,
): void {
    const carriedFlag = this.collisionService
        .findRelativePositionEntityWithType(tank,
            EntityType.FLAG);

    const boundingBox = flag.getComponent(BoundingBoxComponent);
    const flagBase = this.collisionService
        .findOverlappingWithType(boundingBox, EntityType.FLAG_BASE);
    if (flag !== carriedFlag) {
        handleFlagInteraction(this.registry, this.playerService,
            tank, flag, carriedFlag, flagBase);
    }
}

export function onTankCollideFlagBase(
    this: PluginContext,
    tank: Entity,
    flagBase: Entity,
): void {
    const carriedFlag = this.collisionService
        .findRelativePositionEntityWithType(tank,
            EntityType.FLAG);
    handleFlagInteraction(this.registry, this.playerService,
        tank, undefined, carriedFlag, flagBase);
}
