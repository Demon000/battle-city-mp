import { HealthComponent } from '@/components/HealthComponent';
import { Color } from '@/drawable/Color';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';

export class TankService {
    private ownPlayerTankId: number | null = null;

    constructor(
        private gameObjectFactory: GameObjectFactory,
        private registry: Registry,
    ) {}

    createTankForPlayer(
        player: Player,
        position: Point,
        color: Color,
    ): Entity {
        return this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.TANK,
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

    setOwnPlayerTankId(tankId: number | null): void {
        this.ownPlayerTankId = tankId;
    }

    getOwnPlayerTankId(): number | null {
        return this.ownPlayerTankId;
    }

    decreaseTankHealth(tankId: number, value: number): void {
        const tank = this.registry.getEntityById(tankId);
        const health = tank.getComponent(HealthComponent);
        health.update({
            value: health.value - value,
        });
    }
}
