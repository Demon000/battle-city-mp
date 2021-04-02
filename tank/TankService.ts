import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import MapRepository from '@/utils/MapRepository';
import { EventEmitter } from 'eventemitter3';
import Tank from './Tank';

export enum TankServiceEvent {
    TANK_REQUESTED_BULLET_SPAWN = 'tank-requested-bullet-spawn',
}

export default class TankService {
    private repository;
    emitter = new EventEmitter();

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
    }

    private resetTankOnIce(tank: Tank): void {
        if (Date.now() - tank.lastSlippingTime < tank.slippingTime) {
            return;
        }

        tank.isSlipping = false;
    }

    processTanksStatus(): void {
        const tanks = this.getTanks();

        for (const tank of tanks) {
            this.processTankShooting(tank);
            this.resetTankOnIce(tank);
        }
    }

    setTankShooting(tankId: number, isShooting: boolean): void {
        const tank = this.getTank(tankId);
        tank.isShooting = isShooting;
    }

    setTankOnIce(tankId: number): void {
        const tank = this.getTank(tankId);
        tank.isSlipping = true;
        tank.lastSlippingTime = Date.now();
    }

    setTankLastBulletShotTime(tankId: number, lastBulletShotTime: number): void {
        const tank = this.getTank(tankId);
        tank.lastBulletShotTime = lastBulletShotTime;
    }
}
