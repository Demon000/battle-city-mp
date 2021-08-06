import { DestroyedComponent } from '@/components/DestroyedComponent';
import { DirectionAxisSnappingComponent } from '@/components/DirectionAxisSnappingComponent';
import { IsUnderBushComponent } from '@/components/IsUnderBushComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { GameObject } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { BoundingBox } from '../bounding-box/BoundingBox';
import { BoundingBoxComponent } from '../bounding-box/BoundingBoxComponent';
import { BoundingBoxRepository } from '../bounding-box/BoundingBoxRepository';
import { BoundingBoxUtils } from '../bounding-box/BoundingBoxUtils';
import { DirtyBoundingBoxComponent } from '../bounding-box/DirtyBoundingBox';
import { Direction } from '../Direction';
import { Point } from '../point/Point';
import { PointUtils } from '../point/PointUtils';
import { PositionComponent } from '../point/PositionComponent';
import { RequestedPositionComponent } from '../point/RequestedPositionComponent';
import { SizeComponent } from '../size/SizeComponent';
import { CollisionTracker } from './CollisionTracker';
import { DirectionUtils } from './DirectionUtils';
import { ICollisionRule, CollisionEvent, CollisionEvents, CollisionResultEvent } from './ICollisionRule';

export enum CollisionServiceEvent {
    OBJECT_TRACKED_COLLISIONS = 'object-tracked-collisions',
    OBJECT_DIRECTION_ALLOWED = 'object-direction-allowed',
}

interface CollisionServiceEvents extends CollisionEvents {
    [CollisionServiceEvent.OBJECT_TRACKED_COLLISIONS]: (movingObjectId: number, tracker: CollisionTracker) => void;
    [CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED]: (movingObjectId: number, direction: Direction) => void;
}

export class CollisionService {
    private rulesMap?: Map<GameObjectType, Map<GameObjectType, ICollisionRule>>;

    emitter = new EventEmitter<CollisionServiceEvents>();

    constructor(
        private gameObjectRepository: MapRepository<number, GameObject>,
        private boundingBoxRepository: BoundingBoxRepository<number>,
        private registry: Registry,
        rules?: ICollisionRule[],
    ) {
        this.gameObjectRepository = gameObjectRepository;
        this.boundingBoxRepository = boundingBoxRepository;

        if (rules) {
            this.rulesMap = new Map<GameObjectType, Map<GameObjectType, ICollisionRule>>();

            for (const rule of rules) {
                for (const movingType of rule.movingTypes) {
                    let movingMap = this.rulesMap.get(movingType);
                    if (!movingMap) {
                        movingMap = new Map<GameObjectType, ICollisionRule>();
                        this.rulesMap.set(movingType, movingMap);
                    }
            
                    for (const staticType of rule.staticTypes) {
                        movingMap.set(staticType, rule);
                    }
                }
            }
        }
    }

    private getRule(movingType: GameObjectType, staticType: GameObjectType): ICollisionRule | undefined {
        if (!this.rulesMap) {
            throw new Error('getRule called but no rules supplied');
        }

        const movingMap = this.rulesMap.get(movingType);
        if (movingMap === undefined) {
            return undefined;
        }

        return movingMap.get(staticType);
    }

    registerObjectCollisions(entity: Entity): void {
        const boundingBox = entity.getComponent(BoundingBoxComponent);
        this.boundingBoxRepository.addBoxValue(entity.id, boundingBox);
    }

    updateObjectCollisions(entity: Entity): void {
        const box = entity.getComponent(BoundingBoxComponent);
        this.boundingBoxRepository.updateBoxValue(entity.id, box);
    }

    unregisterObjectCollisions(objectId: number): void {
        this.boundingBoxRepository.removeValue(objectId);
    }

    getOverlappingObjects(box: BoundingBox): Iterable<number> {
        return this.boundingBoxRepository.getBoxOverlappingValues(box);
    }

    private isPositionCloserToDirection(newPosition: Point, oldPosition: Point, direction: Direction): boolean {
        switch (direction) {
            case Direction.UP:
                if (newPosition.y > oldPosition.y) {
                    return true;
                }
                break;
            case Direction.RIGHT:
                if (newPosition.x < oldPosition.x) {
                    return true;
                }
                break;
            case Direction.DOWN:
                if (newPosition.y < oldPosition.y) {
                    return true;
                }
                break;
            case Direction.LEFT:
                if (newPosition.x > oldPosition.x) {
                    return true;
                }
                break;
        }

        return false;
    }

    private snapObjectToBoundingBoxEdge(
        object: GameObject,
        position: Point,
        box: BoundingBox,
        direction: Direction,
    ): void {
        switch (direction) {
            case Direction.UP:
                position.y = box.br.y;
                break;
            case Direction.RIGHT:
                position.x = box.tl.x - object.width;
                break;
            case Direction.DOWN:
                position.y = box.tl.y - object.height;
                break;
            case Direction.LEFT:
                position.x = box.br.x;
                break;
        }
    }

    private isObjectOverlapping(
        isValidPosition: boolean,
        preventedBoundingBox: BoundingBox,
        movedBoundingBox: BoundingBox,
        overlappingBoundingBox: BoundingBox,
    ): boolean {
        if (isValidPosition && BoundingBoxUtils.overlapsEqual(preventedBoundingBox,
            overlappingBoundingBox)) {
            return true;
        }

        if (!isValidPosition && BoundingBoxUtils.overlaps(movedBoundingBox,
            overlappingBoundingBox)) {
            return true;
        }

        return false;
    }

    private _validateObjectMovement(
        movingObject: GameObject,
        position: Point,
        direction?: Direction,
        trySnapping = true,
    ): void {
        if (this.rulesMap === undefined) {
            throw new Error('Cannot validate object movement when rules map is not set');
        }

        const movingDirection = direction ?? movingObject.direction;
        const originalBoundingBox = movingObject
            .getComponent(BoundingBoxComponent);
        const originalPosition = movingObject
            .getComponent(PositionComponent);
        const movedBoundingBox = BoundingBoxUtils
            .reposition(originalBoundingBox, originalPosition, position);
        const mergedBoundingBox = BoundingBoxUtils
            .combine(originalBoundingBox, movedBoundingBox);
        const overlappingObjectIds = this
            .getOverlappingObjects(mergedBoundingBox);
        const overlappingObjects = this.gameObjectRepository
            .getMultiple(overlappingObjectIds);

        let movementPreventingObject;
        const collidingObjectNotifications = new Array<[CollisionEvent, GameObject]>();
        const collidingObjectTrackings = new Array<GameObject>();
        for (const overlappingObject of overlappingObjects) {
            if (movingObject.id === overlappingObject.id) {
                continue;
            }

            if (overlappingObject.hasComponent(DestroyedComponent)) {
                continue;
            }

            const rule = this.getRule(movingObject.type, overlappingObject.type);
            if (rule === undefined) {
                continue;
            }

            for (const result of rule.result) {
                if (result.type === CollisionResultEvent.PREVENT_MOVEMENT) {
                    const overlappingBoundingBox = overlappingObject
                        .getComponent(BoundingBoxComponent);
                    const isAlreadyInside = BoundingBoxUtils
                        .overlaps(originalBoundingBox, overlappingBoundingBox);

                    let isCloser = true;
                    if (movementPreventingObject !== undefined) {
                        const overlappingPosition =
                            overlappingObject.getComponent(PositionComponent);
                        const movementPreventingPosition =
                            movementPreventingObject.getComponent(PositionComponent);
                        isCloser = this.isPositionCloserToDirection(overlappingPosition,
                            movementPreventingPosition, movingDirection);
                    }

                    if (!isAlreadyInside && isCloser) {
                        movementPreventingObject = overlappingObject;
                    }
                } else if (result.type === CollisionResultEvent.TRACK) {
                    collidingObjectTrackings.push(overlappingObject);
                } else if (result.type === CollisionResultEvent.NOTIFY) {
                    collidingObjectNotifications.push([result.name, overlappingObject]);
                }
            }
        }

        /*
         * We found a movement preventing object, snap to its edge.
         * This usually works, because we can only move towards an object.
         * But there's an edge case where the moving object has turned in another
         * direction, and we try to snap it so he can fit between blocks with ease,
         * in which case we cannot try to snap it again to the edge of the movement
         * movement preventing object.
         */
        if (movementPreventingObject !== undefined) {
            const preventingBoundingBox = movementPreventingObject
                .getComponent(BoundingBoxComponent);
            this.snapObjectToBoundingBoxEdge(movingObject, position,
                preventingBoundingBox, movingDirection);
        }

        /*
         * If we can't try snapping to the movement preventing object's edge,
         * then the position we're trying to move to is inside the movement preventing object,
         * which means it is invalid, and we shouldn't update the object position.
         */
        let isValidPosition = true;
        if (!trySnapping && movementPreventingObject !== undefined) {
            isValidPosition = false;
        }

        if (isValidPosition) {
            movingObject.updateComponent(PositionComponent, position);
        }

        const preventedBoundingBox = BoundingBoxUtils
            .reposition(originalBoundingBox, originalPosition, position);

        for (const [name, overlappingObject] of collidingObjectNotifications) {
            const overlappingBoundingBox = overlappingObject
                .getComponent(BoundingBoxComponent);
            if (this.isObjectOverlapping(isValidPosition, preventedBoundingBox, movedBoundingBox,
                overlappingBoundingBox)) {
                this.emitter.emit(name, movingObject.id, overlappingObject.id, position);
            }
        }

        const collisionTracker = new CollisionTracker();
        for (const overlappingObject of collidingObjectTrackings) {
            const overlappingBoundingBox = overlappingObject
                .getComponent(BoundingBoxComponent);
            if (this.isObjectOverlapping(isValidPosition, preventedBoundingBox, movedBoundingBox,
                overlappingBoundingBox)) {
                collisionTracker.markTypeObject(overlappingObject.type, overlappingObject.id);
            }
        }

        this.emitter.emit(CollisionServiceEvent.OBJECT_TRACKED_COLLISIONS,
            movingObject.id, collisionTracker);
    }

    validateObjectMovement(
        objectId: number,
        position: Point,
        direction?: Direction,
        trySnapping = true,
    ): void {
        const movingObject = this.gameObjectRepository.get(objectId);
        this._validateObjectMovement(movingObject, position, direction, trySnapping);
    }

    processObjectsRequestedPosition(): void {
        for (const component of this.registry.getComponents(RequestedPositionComponent)) {
            component.remove();

            const object = component.entity as GameObject;
            this._validateObjectMovement(object, component, undefined, true);
        }
    }

    private calculateSnappedCoordinates(value: number, snapping: number): number {
        const overSnapping = value % snapping;
        let snapped = value - overSnapping;
        if (overSnapping > snapping / 2) {
            snapped += snapping;
        }
        return snapped;
    }

    validateObjectDirection(objectId: number, direction: Direction): void {
        const object = this.gameObjectRepository.get(objectId);
        const oldDirection = object.direction;

        this.emitter.emit(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED, objectId, direction);

        if (DirectionUtils.isSameAxis(oldDirection, direction)) {
            return;
        }


        const directionAxisSnappingComponent =
            object.findComponent(DirectionAxisSnappingComponent);
        if (directionAxisSnappingComponent === undefined) {
            return;
        }

        const value = directionAxisSnappingComponent.value;
        const position = object.getComponent(PositionComponent);
        const newPosition = PointUtils.clone(position);
        if (DirectionUtils.isHorizontalAxis(direction)) {
            newPosition.y = this.calculateSnappedCoordinates(position.y, value);
        } else {
            newPosition.x = this.calculateSnappedCoordinates(position.x, value);
        }

        this.validateObjectMovement(objectId, newPosition, oldDirection, false);
    }

    private isOverlappingWithType(entity: Entity, type: GameObjectType): boolean {
        const boundingBox = entity.getComponent(BoundingBoxComponent);
        const overlappingObjectIds = this.getOverlappingObjects(boundingBox);
        const overlappingObjects = this.gameObjectRepository.getMultiple(overlappingObjectIds);

        for (const overlappingObject of overlappingObjects) {
            if (overlappingObject.type === type) {
                return true;
            }
        }

        return false;
    }

    processObjectsIsUnderBush(): void {
        for (const component of this.registry.getComponents(IsUnderBushComponent)) {
            const object = component.entity as GameObject;
            const isUnderBush = this.isOverlappingWithType(object, GameObjectType.BUSH);
            if (component.value === isUnderBush) {
                continue;
            }

            component.update({
                value: isUnderBush,
            });
        }
    }

    markBoundingBoxNeedsUpdate(entity: Entity): void {
        if (!entity.hasComponent(BoundingBoxComponent)) {
            return;
        }

        entity.upsertComponent(DirtyBoundingBoxComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    processObjectsDirtyBoundingBox(): void {
        for (const component of this.registry.getComponents(DirtyBoundingBoxComponent)) {
            component.remove();

            const entity = component.entity;
            const size = entity.getComponent(SizeComponent);
            const position = entity.getComponent(PositionComponent);
            const boundingBox = entity.getComponent(BoundingBoxComponent);
            const brx = position.x + size.width;
            const bry = position.y + size.height;

            if (boundingBox.tl.x === position.x
                && boundingBox.tl.y === position.y
                && boundingBox.br.x === brx
                && boundingBox.br.y === bry) {
                return;
            }

            boundingBox.update({
                tl: {
                    x: position.x,
                    y: position.y,
                },
                br: {
                    x: brx,
                    y: bry,
                },
            });

            if (this.boundingBoxRepository.hasNode(entity.id)) {
                this.boundingBoxRepository.updateBoxValue(entity.id, boundingBox);
            } else {
                this.boundingBoxRepository.addBoxValue(entity.id, boundingBox);
            }
        }
    }

    clear(): void {
        this.boundingBoxRepository.clear();
    }
}
