import BoundingBox from '@/physics/bounding-box/BoundingBox';
import PlayerSpawn from '@/player-spawn/PlayerSpawn';
import MapRepository from '@/utils/MapRepository';
import Random from '@/utils/Random';
import EventEmitter from 'eventemitter3';
import { Direction } from '../physics/Direction';
import Point from '../physics/point/Point';
import PointUtils from '../physics/point/PointUtils';
import GameObject, { PartialGameObjectOptions } from './GameObject';
import { GameObjectType } from './GameObjectType';

export enum GameObjectServiceEvent {
    OBJECT_REQUESTED_POSITION = 'object-requested-position',
    OBJECT_REQUESTED_DIRECTION = 'object-requested-direction',
    OBJECT_CHANGED = 'object-changed',
    OBJECT_BOUNDING_BOX_CHANGED = 'object-bounding-box-changed',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_BEFORE_UNREGISTER = 'object-before-unregister',
    OBJECT_UNREGISTERED = 'object-unregistered',
}

interface GameObjectServiceEvents {
    [GameObjectServiceEvent.OBJECT_REQUESTED_POSITION]: (objectId: number, position: Point) => void,
    [GameObjectServiceEvent.OBJECT_REQUESTED_DIRECTION]: (objectId: number, direction: Direction) => void,
    [GameObjectServiceEvent.OBJECT_CHANGED]: (objectId: number, options: PartialGameObjectOptions) => void,
    [GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED]: (objectId: number, box: BoundingBox) => void,
    [GameObjectServiceEvent.OBJECT_REGISTERED]: (object: GameObject) => void,
    [GameObjectServiceEvent.OBJECT_BEFORE_UNREGISTER]: (objectId: number) => void,
    [GameObjectServiceEvent.OBJECT_UNREGISTERED]: (objectId: number) => void,
}

export default class GameObjectService {
    private repository;
    emitter = new EventEmitter<GameObjectServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

    findObject(objectId: number): GameObject | undefined {
        return this.repository.find(objectId);
    }

    getObject(objectId: number): GameObject {
        return this.repository.get(objectId);
    }

    getObjects(): GameObject[] {
        return this.repository.getAll();
    }

    getMultipleObjects(objectIds: Iterable<number>): Iterable<GameObject> {
        return this.repository.getMultiple(objectIds);
    }

    registerObject(object: GameObject): void {
        this.repository.add(object.id, object);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_REGISTERED, object);
    }

    registerObjects(objects: GameObject[]): void {
        for (const object of objects) {
            this.registerObject(object);
        }
    }

    unregisterObject(objectId: number): void {
        const object = this.findObject(objectId);
        if (object === undefined) {
            return;
        }

        this.emitter.emit(GameObjectServiceEvent.OBJECT_BEFORE_UNREGISTER, objectId);
        this.repository.remove(objectId);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_UNREGISTERED, objectId);
    }

    setObjectPosition(objectId: number, position: Point): void {
        const object = this.repository.get(objectId);
        object.position = position;
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, {
            position,
        } as PartialGameObjectOptions);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, objectId, object.getBoundingBox());
    }

    setObjectDirection(objectId: number, direction: Direction): void {
        const object = this.repository.get(objectId);
        object.direction = direction;
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, {
            direction,
        } as PartialGameObjectOptions);
    }

    setObjectDestroyed(objectId: number): void {
        const object = this.repository.get(objectId);
        object.destroyed = true;
    }

    updateObject(objectId: number, objectOptions: PartialGameObjectOptions): void {
        const object = this.repository.get(objectId);
        object.setOptions(objectOptions);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, objectOptions);
        if (objectOptions.position !== undefined) {
            this.emitter.emit(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, object.id, object.getBoundingBox());
        }
    }

    setObjectMovementDirection(objectId: number, direction: Direction | null): void {
        const object = this.repository.get(objectId);
        object.movementDirection = direction;
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, {
            movementDirection: direction,
        } as PartialGameObjectOptions);
    }

    processObjectDirection(object: GameObject): void {
        if (object.movementDirection !== null
            && object.direction !== object.movementDirection) {
            this.emitter.emit(GameObjectServiceEvent.OBJECT_REQUESTED_DIRECTION, object.id, object.movementDirection);
        }
    }

    getRandomSpawnPosition(teamId?: string): Point {
        const objects = this.repository.getAll();
        const playerSpawnObjects = new Array<GameObject>();

        for (const object of objects) {
            if (object.type === GameObjectType.PLAYER_SPAWN) {
                const playerSpawn = object as PlayerSpawn;
                if (teamId === undefined || teamId === playerSpawn.teamId) {
                    playerSpawnObjects.push(object);
                }
            }
        }

        const playerSpawnObject = Random.getRandomArrayElement(playerSpawnObjects);
        return playerSpawnObject.position;
    }

    private processObjectMovement(object: GameObject, delta: number): void {
        let newMovementSpeed = object.movementSpeed;
        if (object.movementDirection === null || object.maxMovementSpeed < newMovementSpeed) {
            newMovementSpeed -= object.maxMovementSpeed * object.decelerationFactor * delta;
            newMovementSpeed = Math.max(0, newMovementSpeed);
        } else if (newMovementSpeed < object.maxMovementSpeed) {
            newMovementSpeed += object.maxMovementSpeed * object.accelerationFactor * delta;
            newMovementSpeed = Math.min(newMovementSpeed, object.maxMovementSpeed);
        }

        if (object.movementSpeed !== newMovementSpeed) {
            object.movementSpeed = newMovementSpeed;
            this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, {
                movementSpeed: newMovementSpeed,
            } as PartialGameObjectOptions);
        }

        const distance = object.movementSpeed * delta;
        if (distance === 0) {
            return;
        }

        const position = PointUtils.clone(object.position);
        if (object.direction === Direction.UP) {
            position.y -= distance;
        } else if (object.direction === Direction.RIGHT) {
            position.x += distance;
        } else if (object.direction === Direction.DOWN) {
            position.y += distance;
        } else if (object.direction === Direction.LEFT) {
            position.x -= distance;
        }

        this.emitter.emit(GameObjectServiceEvent.OBJECT_REQUESTED_POSITION, object.id, position);
    }

    private isPastAutomaticDestroy(object: GameObject): boolean {
        if (object.automaticDestroyTime === undefined) {
            return false;
        }

        return Date.now() - object.spawnTime > object.automaticDestroyTime;
    }

    private processObjectDestroy(object: GameObject): boolean {
        if (object.destroyed || this.isPastAutomaticDestroy(object)) {
            this.unregisterObject(object.id);
            return true;
        }

        return false;
    }

    processObjectsStatus(delta: number): void {
        const objects = this.repository.getAll();
        for (const object of objects) {
            const destroyed = this.processObjectDestroy(object);
            if (destroyed) {
                continue;
            }

            this.processObjectDirection(object);
            this.processObjectMovement(object, delta);
        }
    }
}
