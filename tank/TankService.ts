import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import MapRepository from '@/utils/MapRepository';
import { EventEmitter } from 'eventemitter3';
import Tank from './Tank';

export enum TankServiceEvent {
    TANK_REQUESTED_BULLET_SPAWN = 'tank-requested-bullet-spawn',
    TANK_REQUESTED_SMOKE_SPAWN = 'tank-requested-smoke-spawn',
}

interface TankServiceEvents {
    [TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN]: (tankId: number) => void,
    [TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN]: (tankId: number) => void,
}

export default class TankService {
    private repository;
    emitter = new EventEmitter<TankServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

    private getTanks(): Tank[] {
        const tanks = new Array<Tank>();

        const objects = this.repository.getAll();
        for (const object of objects) {
            if (object.type === GameObjectType.TANK) {
                tanks.push(object as Tank);
            }
        }

        return tanks;
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
}
