import { HealthComponent } from '@/components/HealthComponent';
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

    setOwnPlayerTank(tank: Entity | null): void {
        const tankId = tank === null ? null : tank.id;
        this.ownPlayerTankId = tankId;
    }

    getOwnPlayerTankId(): EntityId | null {
        return this.ownPlayerTankId;
    }

    decreaseTankHealth(tank: Entity, value: number): void {
        const health = tank.getComponent(HealthComponent);
        health.update({
            value: health.value - value,
        });
    }
}
