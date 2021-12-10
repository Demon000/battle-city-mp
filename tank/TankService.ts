import { HealthComponent } from '@/components/HealthComponent';
import { Color } from '@/drawable/Color';
import { Registry } from '@/ecs/Registry';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';
import EventEmitter from 'eventemitter3';
import { Tank, PartialTankOptions } from './Tank';

export enum TankServiceEvent {
    TANK_UPDATED = 'tank-updated',
}

export interface TankServiceEvents {
    [TankServiceEvent.TANK_UPDATED]: (tankId: number, options: PartialTankOptions) => void,
}

export class TankService {
    private ownPlayerTankId: number | null = null;
    emitter = new EventEmitter<TankServiceEvents>();

    constructor(
        private gameObjectFactory: GameObjectFactory,
        private registry: Registry,
    ) {}

    createTankForPlayer(
        player: Player,
        position: Point,
        color: Color,
    ): Tank {
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
        }) as Tank;
    }

    setOwnPlayerTankId(tankId: number | null): void {
        this.ownPlayerTankId = tankId;
    }

    getOwnPlayerTankId(): number | null {
        return this.ownPlayerTankId;
    }

    setTankFlag(tankId: number, teamId: string | null, color: Color | null, sourceId: number | null): void {
        const tank = this.registry.getEntityById(tankId) as Tank;
        tank.flagTeamId = teamId;
        tank.flagColor = color;
        tank.flagSourceId = sourceId;

        this.emitter.emit(TankServiceEvent.TANK_UPDATED, tankId, {
            flagTeamId: teamId,
            flagColor: color,
        });
    }

    clearTankFlag(tankId: number): void {
        this.setTankFlag(tankId, null, null, null);
    }

    decreaseTankHealth(tankId: number, value: number): void {
        const tank = this.registry.getEntityById(tankId);
        const health = tank.getComponent(HealthComponent);
        health.update({
            value: health.value - value,
        });
    }
}
