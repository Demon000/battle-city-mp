import { Color } from '@/drawable/Color';
import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import CollisionTracker from '@/physics/collisions/CollisionTracker';
import LazyIterable from '@/utils/LazyIterable';
import MapRepository from '@/utils/MapRepository';
import { EventEmitter } from 'eventemitter3';
import Tank, { PartialTankOptions } from './Tank';

export enum TankServiceEvent {
    TANK_REQUESTED_BULLET_SPAWN = 'tank-requested-bullet-spawn',
    TANK_REQUESTED_SMOKE_SPAWN = 'tank-requested-smoke-spawn',
    TANK_UPDATED = 'tank-updated',
}

interface TankServiceEvents {
    [TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN]: (tankId: number) => void,
    [TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN]: (tankId: number) => void,
    [TankServiceEvent.TANK_UPDATED]: (tankId: number, options: PartialTankOptions) => void,
}

export default class TankService {
    private repository;
    emitter = new EventEmitter<TankServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

    private getTanks(): Iterable<Tank> {
        const objects = this.repository.getAll();

        return LazyIterable.from(objects)
            .filter(o => o.type === GameObjectType.TANK) as Iterable<Tank>;
    }

    getTank(tankId: number): Tank {
        const object = this.repository.get(tankId);
        if (object.type !== GameObjectType.TANK) {
            throw new Error('Game object type is not tank');
        }

        return object as Tank;
    }

    findTank(tankId: number): Tank | undefined {
        const object = this.repository.find(tankId);
        if (object === undefined) {
            return undefined;
        }

        if (object.type !== GameObjectType.TANK) {
            throw new Error('Game object type is not tank');
        }

        return object as Tank;
    }

    addTankBullet(tankId: number, bulletId: number): void {
        const tank = this.getTank(tankId);
        tank.bulletIds.push(bulletId);
    }

    removeTankBullet(tankId: number, bulletId: number): void {
        const tank = this.getTank(tankId);
        const bulletIndex = tank.bulletIds.findIndex(b => b === bulletId);
        tank.bulletIds.splice(bulletIndex, 1);
    }

    private canTankSpawnBullet(tank: Tank): boolean {
        if (tank.bulletIds.length >= tank.maxBullets) {
            return false;
        }

        if (Date.now() - tank.lastBulletShotTime < tank.bulletCooldown) {
            return false;
        }

        return true;
    }

    private processTankShooting(tank: Tank): void {
        if (!tank.isShooting || !this.canTankSpawnBullet(tank)) {
            return;
        }

        this.emitter.emit(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN, tank.id);
        tank.lastBulletShotTime = Date.now();
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

    updateTankCollisions(tankId: number, tracker: CollisionTracker): void {
        const tank = this.getTank(tankId);

        tank.isOnIce = tracker.isCollidingWithType(GameObjectType.ICE);
        tank.isOnSand = tracker.isCollidingWithType(GameObjectType.SAND);
        tank.isUnderBush = tracker.isCollidingWithType(GameObjectType.BUSH);

        this.emitter.emit(TankServiceEvent.TANK_UPDATED, tankId, {
            isUnderBush: tank.isUnderBush,
        });
    }

    processTanksStatus(): void {
        const tanks = this.getTanks();

        for (const tank of tanks) {
            this.processTankShooting(tank);
            this.processTankSmoking(tank);
        }
    }

    setTankShooting(tankId: number, isShooting: boolean): void {
        const tank = this.getTank(tankId);
        tank.isShooting = isShooting;
    }

    setTankFlag(tankId: number, teamId: string | null, color: Color | null, sourceId: number | null): void {
        const tank = this.getTank(tankId);
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
}
