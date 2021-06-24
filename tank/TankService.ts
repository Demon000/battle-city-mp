import { Color } from '@/drawable/Color';
import { GameObject } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { CollisionTracker } from '@/physics/collisions/CollisionTracker';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';
import { LazyIterable } from '@/utils/LazyIterable';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { Tank, PartialTankOptions } from './Tank';

export enum TankServiceEvent {
    TANK_REQUESTED_BULLET_SPAWN = 'tank-requested-bullet-spawn',
    TANK_REQUESTED_SMOKE_SPAWN = 'tank-requested-smoke-spawn',
    TANK_UPDATED = 'tank-updated',
    OWN_PLAYER_TANK_CHANGED_MAX_HEALTH = 'own-player-tank-changed-max-health',
    OWN_PLAYER_TANK_CHANGED_HEALTH = 'own-player-tank-changed-health',
    OWN_PLAYER_TANK_CHANGED_MAX_BULLETS = 'own-player-tank-changed-max-bullets',
    OWN_PLAYER_TANK_CHANGED_BULLETS = 'own-player-tank-changed-bullets',
}

export interface TankServiceEvents {
    [TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN]: (tankId: number) => void,
    [TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN]: (tankId: number) => void,
    [TankServiceEvent.TANK_UPDATED]: (tankId: number, options: PartialTankOptions) => void,
    [TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH]: (maxHealth: number) => void,
    [TankServiceEvent.OWN_PLAYER_TANK_CHANGED_HEALTH]: (health: number) => void,
    [TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS]: (maxBullets: number) => void,
    [TankServiceEvent.OWN_PLAYER_TANK_CHANGED_BULLETS]: (bullets: number) => void,
}

export class TankService {
    private repository;
    private ownPlayerTankId: number | null = null;
    emitter = new EventEmitter<TankServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

    private getTanks(): Iterable<Tank> {
        const objects = this.repository.getAll();

        return LazyIterable.from(objects)
            .filter(o => o.type === GameObjectType.TANK) as Iterable<Tank>;
    }

    createTankForPlayer(
        player: Player,
        position: Point,
        color: Color,
    ): Tank {
        return new Tank({
            position,
            color,
            playerId: player.id,
            playerName: player.displayName,
            teamId: player.teamId,
            tier: player.requestedTankTier,
            collisionsDisabled: player.mapEditorEnabled,
        });
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

    setOwnPlayerTankId(tankId: number | null): void {
        this.ownPlayerTankId = tankId;

        if (tankId !== null) {
            const tank = this.getTank(tankId);

            this.emitter.emit(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                tank.maxHealth);
            this.emitter.emit(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                tank.health);
            this.emitter.emit(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
                tank.maxBullets);
            this.emitter.emit(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
                tank.bulletIds.length);
        }
    }

    addRemoveTankBullets(tankId: number, bulletId: number, add: boolean): void {
        const tank = this.getTank(tankId);

        if (add) {
            tank.bulletIds.push(bulletId);
        } else {
            const bulletIndex = tank.bulletIds.findIndex(b => b === bulletId);
            tank.bulletIds.splice(bulletIndex, 1);
        }

        this.emitter.emit(TankServiceEvent.TANK_UPDATED, tankId, {
            bulletIds: tank.bulletIds,
        });
    }

    addTankBullet(tankId: number, bulletId: number): void {
        this.addRemoveTankBullets(tankId, bulletId, true);
    }

    removeTankBullet(tankId: number, bulletId: number): void {
        this.addRemoveTankBullets(tankId, bulletId, false);
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

    updateTank(tankId: number, tankOptions: PartialTankOptions): void {
        if (tankId === this.ownPlayerTankId) {
            if (tankOptions.health !== undefined) {
                this.emitter.emit(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                    tankOptions.health);
            }

            if (tankOptions.bulletIds !== undefined) {
                this.emitter.emit(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
                    tankOptions.bulletIds.length);
            }
        }
    }

    updateTankCollisions(tankId: number, tracker: CollisionTracker): void {
        const tank = this.getTank(tankId);

        tank.isOnIce = tracker.isCollidingWithType(GameObjectType.ICE);
        tank.isOnSand = tracker.isCollidingWithType(GameObjectType.SAND);
        const isUnderBush = tracker.isCollidingWithType(GameObjectType.BUSH);
        if (isUnderBush !== tank.isUnderBush) {
            tank.isUnderBush = isUnderBush;

            this.emitter.emit(TankServiceEvent.TANK_UPDATED, tankId, {
                isUnderBush: tank.isUnderBush,
            });
        }
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

    decreaseTankHealth(tankId: number, value: number): void {
        const tank = this.getTank(tankId);
        tank.health -= value;

        this.emitter.emit(TankServiceEvent.TANK_UPDATED, tankId, {
            health: tank.health,
        });
    }
}
