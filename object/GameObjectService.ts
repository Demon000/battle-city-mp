import { AutomaticDestroyComponent } from '@/components/AutomaticDestroyComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { IsMovingComponent } from '@/components/IsMovingComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { DirectionComponent } from '@/physics/DirectionComponent';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { DirtyCenterPositionComponent } from '@/physics/point/DirtyCenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { RequestedPositionComponent } from '@/physics/point/RequestedPositionComponent';
import { RequestedDirectionComponent } from '@/physics/RequestedDirectionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';
import { PlayerSpawn } from '@/player-spawn/PlayerSpawn';
import { MapRepository } from '@/utils/MapRepository';
import { Random } from '@/utils/Random';
import EventEmitter from 'eventemitter3';
import { Direction } from '../physics/Direction';
import { Point } from '../physics/point/Point';
import { PointUtils } from '../physics/point/PointUtils';
import { GameObject, PartialGameObjectOptions } from './GameObject';
import { GameObjectType } from './GameObjectType';

export enum GameObjectServiceEvent {
    OBJECT_CHANGED = 'object-changed',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_BEFORE_UNREGISTER = 'object-before-unregister',
    OBJECT_UNREGISTERED = 'object-unregistered',
}

export interface GameObjectServiceEvents {
    [GameObjectServiceEvent.OBJECT_CHANGED]: (objectId: number, options: PartialGameObjectOptions) => void,
    [GameObjectServiceEvent.OBJECT_REGISTERED]: (object: GameObject) => void,
    [GameObjectServiceEvent.OBJECT_BEFORE_UNREGISTER]: (objectId: number) => void,
    [GameObjectServiceEvent.OBJECT_UNREGISTERED]: (objectId: number) => void,
}

export class GameObjectService {
    emitter = new EventEmitter<GameObjectServiceEvents>();

    constructor(
        private repository: MapRepository<number, GameObject>,
        private registry: Registry,
        private movingRespository?: MapRepository<number, GameObject>,
    ) {}

    findObject(objectId: number): GameObject | undefined {
        return this.repository.find(objectId);
    }

    getObject(objectId: number): GameObject {
        return this.repository.get(objectId);
    }

    getObjects(): Iterable<GameObject> {
        return this.repository.getAll();
    }

    getMultipleObjects(objectIds: Iterable<number>): Iterable<GameObject> {
        return this.repository.getMultiple(objectIds);
    }

    registerObject(object: GameObject): void {
        this.repository.add(object.id, object);
        if (object.movementDirection !== null || object.movementSpeed !== 0) {
            this.movingRespository?.add(object.id, object);
        }
        this.emitter.emit(GameObjectServiceEvent.OBJECT_REGISTERED, object);
    }

    registerObjects(objects: Iterable<GameObject>): void {
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
        this.movingRespository?.remove(object.id);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_UNREGISTERED, objectId);
    }

    unregisterAll(): void {
        const objects = this.repository.getAll();
        for (const object of objects) {
            this.unregisterObject(object.id);
        }
    }

    setObjectDestroyed(objectId: number): void {
        const object = this.repository.get(objectId);
        object.upsertComponent(DestroyedComponent);
    }

    updateObject(objectId: number, objectOptions: PartialGameObjectOptions): void {
        const object = this.repository.get(objectId);
        object.setOptions(objectOptions);
        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, objectOptions);
    }

    setObjectMovementDirection(objectId: number, direction: Direction | null): void {
        const object = this.repository.get(objectId);
        object.movementDirection = direction;

        if (object.movementDirection !== null) {
            this.movingRespository?.add(object.id, object);
        }

        this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, {
            movementDirection: direction,
        } as PartialGameObjectOptions);
    }

    processObjectDirection(object: GameObject): void {
        const direction = object.getComponent(DirectionComponent).value;
        if (object.movementDirection !== null && direction !== object.movementDirection) {
            object.upsertComponent(RequestedDirectionComponent, {
                value: object.movementDirection,
            }, {
                flags: ComponentFlags.LOCAL_ONLY,
            });
        }
    }

    getRandomSpawnPosition(teamId: string | null): Point {
        const objects = this.repository.getAll();
        const playerSpawnObjects = new Array<GameObject>();

        for (const object of objects) {
            if (object.type === GameObjectType.PLAYER_SPAWN) {
                const playerSpawn = object as PlayerSpawn;
                if (teamId === null || teamId === playerSpawn.teamId) {
                    playerSpawnObjects.push(object);
                }
            }
        }

        const playerSpawnObject = Random.getRandomArrayElement(playerSpawnObjects);
        if (playerSpawnObject === undefined) {
            throw new Error('Failed to get random spawn object');
        }

        return playerSpawnObject.getComponent(PositionComponent);
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

            if (newMovementSpeed === 0 && object.movementDirection === null) {
                this.movingRespository?.remove(object.id);
            } else {
                this.movingRespository?.add(object.id, object);
            }

            this.emitter.emit(GameObjectServiceEvent.OBJECT_CHANGED, object.id, {
                movementSpeed: newMovementSpeed,
            } as PartialGameObjectOptions);
        }

        const distance = object.movementSpeed * delta;
        if (distance === 0) {
            return;
        }

        const positionComponent = object.getComponent(PositionComponent);
        const position = PointUtils.clone(positionComponent);
        const direction = object.getComponent(DirectionComponent).value;
        if (direction === Direction.UP) {
            position.y -= distance;
        } else if (direction === Direction.RIGHT) {
            position.x += distance;
        } else if (direction === Direction.DOWN) {
            position.y += distance;
        } else if (direction === Direction.LEFT) {
            position.x -= distance;
        }

        object.upsertComponent(RequestedPositionComponent, position, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    processObjectsDestroyed(): void {
        for (const component of this.registry.getComponents(DestroyedComponent)) {
            this.unregisterObject(component.entity.id);
        }
    }

    processObjectsAutomaticDestroy(): void {
        for (const component of this.registry.getComponents(AutomaticDestroyComponent)) {
            const entity = component.entity;
            const automaticDestroyTimeMs =
                entity.getComponent(AutomaticDestroyComponent).timeMs;
            const spawnTime =
                entity.getComponent(SpawnTimeComponent).value;
            if (Date.now() - spawnTime > automaticDestroyTimeMs) {
                entity.addComponent(DestroyedComponent);
            }
        }
    }

    processObjectsIsMoving(): void {
        for (const component of this.registry.getComponents(IsMovingComponent)) {
            const object = component.entity as GameObject;
            const isMoving = object.movementSpeed > 0;
            if (component.value === isMoving) {
                continue;
            }

            component.update({
                value: isMoving,
            });
        }
    }

    markObjectsDirtyCenterPosition(entity: Entity): void {
        if (!entity.hasComponent(DirtyCenterPositionComponent)) {
            return;
        }

        entity.upsertComponent(DirtyCenterPositionComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    processObjectsDirtyCenterPosition(): void {
        for (const component of this.registry.getComponents(DirtyCenterPositionComponent)) {
            const entity = component.entity;
            const centerPosition = entity.getComponent(CenterPositionComponent);
            const position = entity.getComponent(PositionComponent);
            const size = entity.getComponent(SizeComponent);

            const x = position.x + size.width / 2;
            const y = position.y + size.height / 2;
            if (x === centerPosition.x && y === centerPosition.y) {
                continue;
            }

            centerPosition.update({
                x,
                y,
            });
        }
    }

    processObjectsDirection(): void {
        const movingObjects = this.movingRespository?.getAll();
        if (movingObjects !== undefined) {
            for (const object of movingObjects) {
                this.processObjectDirection(object);
            }
        }
    }

    processObjectsPosition(delta: number): void {
        const movingObjects = this.movingRespository?.getAll();
        if (movingObjects !== undefined) {
            for (const object of movingObjects) {
                this.processObjectMovement(object, delta);
            }
        }
    }

    clear(): void {
        this.repository.clear();
    }
}
