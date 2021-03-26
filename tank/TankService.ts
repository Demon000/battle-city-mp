import EventEmitter from 'eventemitter3';
import Point from '../physics/point/Point';
import Tank from './Tank';

export enum TankServiceEvent {
    TANK_SPAWNED = 'tank-spawned',
    TANK_DESPAWNED = 'tank-despawned',
    PLAYER_TANK_CHANGED = 'player-tank-changed',
}

export default class TankService {
    emitter = new EventEmitter(); 

    spawnPlayerTank(playerId: string, position: Point): void {
        const tank = new Tank({
            position,
            playerId,
        });
        this.emitter.emit(TankServiceEvent.TANK_SPAWNED, tank);
        this.emitter.emit(TankServiceEvent.PLAYER_TANK_CHANGED, playerId, tank.id);
    }

    despawnPlayerTank(playerId: string, tankId: number): void {
        this.emitter.emit(TankServiceEvent.TANK_DESPAWNED, tankId);
        this.emitter.emit(TankServiceEvent.PLAYER_TANK_CHANGED, playerId, tankId);
    }
}
