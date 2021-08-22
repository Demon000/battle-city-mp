import { AutomaticDestroyComponent } from '@/components/AutomaticDestroyComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { DirtyIsMovingComponent } from '@/components/DirtyIsMovingComponent';
import { IsMovingComponent } from '@/components/IsMovingComponent';
import { IsMovingTrackingComponent } from '@/components/IsMovingTrackingComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { SpawnComponent } from '@/components/SpawnComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { WorldEntityComponent } from '@/components/WorldEntityComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';
import { Registry } from '@/ecs/Registry';
import { DirectionComponent } from '@/physics/DirectionComponent';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { DirtyCenterPositionComponent } from '@/physics/point/DirtyCenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { RequestedPositionComponent } from '@/physics/point/RequestedPositionComponent';
import { RequestedDirectionComponent } from '@/physics/RequestedDirectionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';
import { PlayerSpawn } from '@/player-spawn/PlayerSpawn';
import { assert } from '@/utils/assert';
import { Random } from '@/utils/Random';
import EventEmitter from 'eventemitter3';
import { Direction } from '../physics/Direction';
import { Point } from '../physics/point/Point';
import { PointUtils } from '../physics/point/PointUtils';
import { GameObject, PartialGameObjectOptions } from './GameObject';
import { GameObjectType } from './GameObjectType';

export enum GameObjectServiceEvent {
    OBJECT_CHANGED = 'object-changed',
}

export interface GameObjectServiceEvents {
    [GameObjectServiceEvent.OBJECT_CHANGED]: (objectId: number, options: PartialGameObjectOptions) => void,
}

export class GameObjectService {
    emitter = new EventEmitter<GameObjectServiceEvents>();

    constructor(
        private registry: Registry,
    ) {}

    markDestroyed(entity: Entity): void {
        entity.upsertComponent(DestroyedComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    markDirtyIsMoving(entity: Entity): void {
        if (!entity.hasComponent(IsMovingTrackingComponent)) {
            return;
        }

        entity.upsertComponent(DirtyIsMovingComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    updateObject(objectId: number, objectOptions: PartialGameObjectOptions): void {
        const object = this.registry.getEntityById(objectId) as GameObject;
        object.setOptions(objectOptions);
    }

    setObjectMovementDirection(entityId: EntityId, direction: Direction | null): void {
        const entity = this.registry.getEntityById(entityId);
        const movement = entity.getComponent(MovementComponent);
        if (movement.direction === direction) {
            return;
        }

        movement.update({
            direction,
        });
    }

    processObjectDirection(entity: Entity): void {
        const movement = entity.getComponent(MovementComponent);
        const direction = entity.getComponent(DirectionComponent).value;
        if (movement.direction !== null && direction !== movement.direction) {
            entity.upsertComponent(RequestedDirectionComponent, {
                value: movement.direction,
            }, {
                flags: ComponentFlags.LOCAL_ONLY,
            });
        }
    }

    getRandomSpawnPosition(teamId: string | null): Point {
        const objects = this.registry.getEntitiesWithComponent(SpawnComponent);
        const playerSpawnObjects = new Array<GameObject>();

        for (const object of objects) {
            if (object.type === GameObjectType.PLAYER_SPAWN) {
                const playerSpawn = object as PlayerSpawn;
                if (teamId === null || teamId === playerSpawn.teamId) {
                    playerSpawnObjects.push(playerSpawn);
                }
            }
        }

        const playerSpawnObject = Random.getRandomArrayElement(playerSpawnObjects);
        assert(playerSpawnObject !== undefined,
            'Failed to get random spawn object');

        return playerSpawnObject.getComponent(PositionComponent);
    }

    private processMovementSpeed(movement: MovementComponent, delta: number): void {
        let newMovementSpeed = movement.speed;
        if (movement.direction === null || movement.maxSpeed < newMovementSpeed) {
            newMovementSpeed -= movement.maxSpeed * movement.decelerationFactor * delta;
            newMovementSpeed = Math.max(0, newMovementSpeed);
        } else if (newMovementSpeed < movement.maxSpeed) {
            newMovementSpeed += movement.maxSpeed * movement.accelerationFactor * delta;
            newMovementSpeed = Math.min(newMovementSpeed, movement.maxSpeed);
        }

        if (newMovementSpeed === movement.speed) {
            return;
        }

        movement.update({
            speed: newMovementSpeed,
        });
    }

    private processObjectMovement(entity: Entity, delta: number): void {
        const movement = entity.getComponent(MovementComponent);

        this.processMovementSpeed(movement, delta);

        const distance = movement.speed * delta;
        if (distance === 0) {
            return;
        }

        const positionComponent = entity.getComponent(PositionComponent);
        const position = PointUtils.clone(positionComponent);
        const direction = entity.getComponent(DirectionComponent).value;
        if (direction === Direction.UP) {
            position.y -= distance;
        } else if (direction === Direction.RIGHT) {
            position.x += distance;
        } else if (direction === Direction.DOWN) {
            position.y += distance;
        } else if (direction === Direction.LEFT) {
            position.x -= distance;
        }

        entity.upsertComponent(RequestedPositionComponent, position, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    processObjectsDestroyed(): void {
        for (const entity of this.registry.getEntitiesWithComponent(DestroyedComponent)) {
            entity.destroy();
        }
    }

    destroyAllWorldEntities(): void {
        for (const entity of this.registry.getEntitiesWithComponent(WorldEntityComponent)) {
            entity.upsertComponent(DestroyedComponent, undefined, {
                flags: ComponentFlags.LOCAL_ONLY,
            });
            entity.destroy();
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
                entity.upsertComponent(DestroyedComponent, undefined, {
                    flags: ComponentFlags.LOCAL_ONLY,
                });
            }
        }
    }

    processObjectsDirtyIsMoving(): void {
        for (const component of this.registry.getComponents(DirtyIsMovingComponent)) {
            component.remove();

            const entity = component.entity;
            const isMovingComponent = entity.findComponent(IsMovingComponent);
            const movement = entity.getComponent(MovementComponent);

            const isMoving = movement.speed > 0 || movement.direction !== null;
            if (isMoving && isMovingComponent === undefined) {
                entity.addComponent(IsMovingComponent, undefined, {
                    flags: ComponentFlags.LOCAL_ONLY,
                });
            } else if (!isMoving && isMovingComponent !== undefined) {
                entity.removeComponent(IsMovingComponent);
            }
        }
    }

    markDirtyCenterPosition(entity: Entity): void {
        if (!entity.hasComponent(CenterPositionComponent)) {
            return;
        }

        entity.upsertComponent(DirtyCenterPositionComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    processObjectsDirtyCenterPosition(): void {
        for (const component of this.registry.getComponents(DirtyCenterPositionComponent)) {
            component.remove();

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
        for (const entity of this.registry.getEntitiesWithComponent(IsMovingComponent)) {
            const object = entity as GameObject;
            this.processObjectDirection(object);
        }
    }

    processObjectsPosition(delta: number): void {
        for (const entity of this.registry.getEntitiesWithComponent(IsMovingComponent)) {
            const object = entity as GameObject;
            this.processObjectMovement(object, delta);
        }
    }
}
