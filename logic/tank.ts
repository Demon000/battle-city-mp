import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { PlayerComponent } from '@/components/PlayerComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { EntityType } from '@/entity/EntityType';
import { PluginContext } from '@/logic/plugin';
import { Point } from '@/physics/point/Point';
import { handleFlagInteraction } from './flag';
import { getPlayerColor, getPlayerName, getPlayerTeamId, setPlayerTank } from './player';
import { TankCollideFlagComponent } from '@/components/TankCollideFlagComponent';

export function createTankForPlayer(
    this: PluginContext,
    player: Entity,
    position: Point,
): Entity {
    const playerTeamId = getPlayerTeamId(player);
    const color = getPlayerColor(this.registry, player);
    const name = getPlayerName(player);
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
    context: PluginContext,
    tank: Entity,
    flag: Entity,
): void {
    const carriedFlag = context.collisionService
        .findRelativePositionEntityWithType(tank,
            EntityType.FLAG);

    const boundingBox = flag.getComponent(BoundingBoxComponent);
    const flagBase = context.collisionService
        .findOverlappingWithType(boundingBox, EntityType.FLAG_BASE);
    if (flag !== carriedFlag) {
        handleFlagInteraction.call(context, tank, flag, carriedFlag, flagBase);
    }
}

export function onTankCollideFlagBase(
    context: PluginContext,
    tank: Entity,
    flagBase: Entity,
): void {
    const carriedFlag = context.collisionService
        .findRelativePositionEntityWithType(tank,
            EntityType.FLAG);
    handleFlagInteraction.call(context, tank, undefined, carriedFlag, flagBase);
}

export function onTankCollideFlagOrFlagBase(
    this: PluginContext,
    component: TankCollideFlagComponent,
): void {
    const entity = component.entity;
    const collidedEntity = this.registry.getEntityById(component.entityId);

    switch (collidedEntity.type) {
        case EntityType.FLAG:
            onTankCollideFlag(this, entity, collidedEntity);
            break;
        case EntityType.FLAG_BASE:
            onTankCollideFlagBase(this, entity, collidedEntity);
            break;
    }
}

function setUnsetTankPlayer(
    registry: Registry,
    entity: Entity,
    unset = false,
) {
    if (entity.type !== EntityType.TANK) {
        return;
    }

    const playerId = entity
        .getComponent(PlayerOwnedComponent).playerId;
    const player = registry.findEntityById(playerId);
    if (player === undefined) {
        return;
    }

    setPlayerTank(player, unset ? null : entity);
}

export function setTankOnPlayer(this: PluginContext, entity: Entity): void {
    setUnsetTankPlayer(this.registry, entity);
}

export function removeTankFromPlayer(this: PluginContext, entity: Entity): void {
    setUnsetTankPlayer(this.registry, entity, true);
}
