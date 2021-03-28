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

    processTankShooting(tank: Tank): void {
        if (!tank.isShooting) {
            return;
        }

        this.emitter.emit(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN, tank.id);
    }

    processTanksShooting(): void {
        const tanks = this.getTanks();

        for (const tank of tanks) {
            this.processTankShooting(tank);
        }
    }

    setTankShooting(tankId: number, isShooting: boolean): void {
        const object = this.repository.get(tankId);
        if (object.type !== GameObjectType.TANK) {
            throw new Error('Game object type is not tank');
        }

        const tank = object as Tank;
        tank.isShooting = isShooting;
    }
}
