import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { ColorComponent } from '@/components/ColorComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { NameComponent } from '@/components/NameComponent';
import { PlayerComponent } from '@/components/PlayerComponent';
import { Entity } from '@/ecs/Entity';
import { EntityType } from '@/entity/EntityType';
import { PluginContext } from '@/logic/plugin';
import { Point } from '@/physics/point/Point';
import { handleFlagInteraction } from './flag';
import { getPlayerColor, getPlayerDisplayName, getPlayerTeamId } from './player';

export function createTankForPlayer(
    this: PluginContext,
    player: Entity,
    position: Point,
): Entity {
    const playerTeamId = getPlayerTeamId(player);
    const color = getPlayerColor(this.registry, player);
    const name = getPlayerDisplayName(player);
    const playerComponent = player.getComponent(PlayerComponent);

    return this.entityFactory.buildFromOptions({
        type: EntityType.TANK,
        subtypes: [playerComponent.requestedTankTier],
        components: {
            TeamOwnedComponent: {
                teamId: playerTeamId,
            },
            PlayerOwnedComponent: {
                playerId: player.id,
            },
            NameComponent: {
                value: name,
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
        handleFlagInteraction(this.registry, tank, flag, carriedFlag, flagBase);
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
    handleFlagInteraction(this.registry, tank, undefined, carriedFlag, flagBase);
}
