import { HealthComponent } from '@/components/HealthComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { Color } from '@/drawable/Color';
import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';
import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';

export class TankService {
    private ownPlayerTankId: EntityId | null = null;

    constructor(
        private entityFactory: EntityFactory,
        private registry: Registry,
    ) {}

    createTankForPlayer(
        player: Player,
        position: Point,
        color: Color,
    ): Entity {
        return this.entityFactory.buildFromOptions({
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

    createTankSpawnEffect(tank: Entity): Entity {
        const position = tank.getComponent(PositionComponent);

        return this.entityFactory.buildFromOptions({
            type: EntityType.SPAWN_EFFECT,
            components: {
                PositionComponent: position,
            },
        });
    }

    setOwnPlayerTankId(tankId: EntityId | null): void {
        this.ownPlayerTankId = tankId;
    }

    getOwnPlayerTankId(): EntityId | null {
        return this.ownPlayerTankId;
    }

    decreaseTankHealth(tankId: EntityId, value: number): void {
        const tank = this.registry.getEntityById(tankId);
        const health = tank.getComponent(HealthComponent);
        health.update({
            value: health.value - value,
        });
    }
}
