import MapRepository from '@/utils/MapRepository';
import Random from '@/utils/Random';
import EventEmitter from 'eventemitter3';
import { Direction } from '../physics/Direction';
import Point from '../physics/point/Point';
import PointUtils from '../physics/point/PointUtils';
import GameObject from './GameObject';
import { GameObjectType } from './GameObjectType';

export enum GameObjectServiceEvent {
    OBJECT_REQUESTED_POSITION = 'object-requested-position',
    OBJECT_REQUESTED_DIRECTION = 'object-requested-direction',
    OBJECT_CHANGED = 'object-changed',
    OBJECT_BOUNDING_BOX_CHANGED = 'object-bounding-box-changed',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregistered',
}

export default class GameObjectService {
    private repository;
    emitter = new EventEmitter();

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

    getMultipleObjects(objectIds: number[]): GameObject[] {
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
        this.repository.remove(objectId);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_UNREGISTERED, objectId);
    }

    setObjectPosition(objectId: number, position: Point): void {
        const object = this.repository.get(objectId);
        object.position = position;
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, objectId);
    }

    setObjectDirection(objectId: number, direction: Direction): void {
        const object = this.repository.get(objectId);
        object.direction = direction;
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, objectId);
    }

    setObjectMoving(objectId: number, isMoving: boolean): void {
        const object = this.repository.get(objectId);
        const requestedSpeed = isMoving ? object.movementSpeed : 0;
        if (object.requestedSpeed === requestedSpeed) {
            return;
        }

        object.requestedSpeed = requestedSpeed;
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object);
    }

    updateObject(newObject: GameObject): void {
        const object = this.repository.get(newObject.id);
        object.setOptions(newObject);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, object.id);
    }

    processObjectDirection(tankId: number, direction: Direction): void {
        const object = this.repository.get(tankId);
        if (object.direction !== direction) {
            this.emitter.emit(GameObjectServiceEvent.OBJECT_REQUESTED_DIRECTION, object.id, direction);
        }
    }

    getRandomSpawnPosition(): Point {
        const objects = this.repository.getAll();
        const playerSpawnObjects = new Array<GameObject>();

        for (const object of objects) {
            if (object.type === GameObjectType.PLAYER_SPAWN) {
                playerSpawnObjects.push(object);
            }
        }

        const playerSpawnObject = Random.getRandomArrayElement(playerSpawnObjects);
        return playerSpawnObject.position;
    }

    private processObjectMovement(object: GameObject, delta: number): void {
        const distance = object.requestedSpeed * delta;
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

    processObjectsMovement(delta: number): void {
        const objects = this.repository.getAll();
        for (const object of objects) {
            this.processObjectMovement(object, delta);
        }
    }
}
