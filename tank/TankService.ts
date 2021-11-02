import { HealthComponent } from '@/components/HealthComponent';
import { Color } from '@/drawable/Color';
import { Registry } from '@/ecs/Registry';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';
import EventEmitter from 'eventemitter3';
import { Tank, PartialTankOptions, TankOptions } from './Tank';
import { TankComponent } from './TankComponent';

export enum TankServiceEvent {
    TANK_REQUESTED_SMOKE_SPAWN = 'tank-requested-smoke-spawn',
    TANK_UPDATED = 'tank-updated',
}

export interface TankServiceEvents {
    [TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN]: (tankId: number) => void,
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
            options: {
                playerId: player.id,
                playerName: player.displayName,
                teamId: player.teamId,
                tier: player.requestedTankTier,
            } as TankOptions,
            components: {
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

    private canTankSpawnSmoke(tank: Tank): boolean {
        const smokeTime = tank.smokeTime;
        if (smokeTime === undefined) {
            return false;
        }

        if (Date.now() - tank.lastSmokeTime < smokeTime) {
            return false;
        }

        return true;
    }

    private processTankSmoking(tank: Tank): void {
        if (!this.canTankSpawnSmoke(tank)) {
            return;
        }

        this.emitter.emit(TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN, tank.id);
        tank.lastSmokeTime = Date.now();
    }

    processTanksStatus(): void {
        for (const entity of this.registry.getEntitiesWithComponent(TankComponent)) {
            const tank = entity as Tank;
            this.processTankSmoking(tank);
        }
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
