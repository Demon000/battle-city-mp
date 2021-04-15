import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import MapRepository from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import BoundingBox from '../bounding-box/BoundingBox';
import BoundingBoxRepository from '../bounding-box/BoundingBoxRepository';
import BoundingBoxUtils from '../bounding-box/BoundingBoxUtils';
import { Direction } from '../Direction';
import Point from '../point/Point';
import DirectionUtils from './DirectionUtils';
import ICollisionRule, { CollisionEvent, CollisionEvents, CollisionResultEvent } from './ICollisionRule';

export enum CollisionServiceEvent {
    OBJECT_POSITION_ALLOWED = 'object-position-allowed',
    OBJECT_DIRECTION_ALLOWED = 'object-direction-allowed',
}

interface CollisionServiceEvents extends CollisionEvents {
    [CollisionServiceEvent.OBJECT_POSITION_ALLOWED]: (movingObjectId: number, position: Point) => void,
    [CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED]: (movingObjectId: number, direction: Direction) => void,
}

export default class CollisionService {
    private gameObjectRepository;
    private boundingBoxRepository;
    private rulesMap?: Map<GameObjectType, Map<GameObjectType, ICollisionRule>>;

    emitter = new EventEmitter<CollisionServiceEvents>();

    constructor(
        gameObjectRepository: MapRepository<number, GameObject>,
        boundingBoxRepository: BoundingBoxRepository<number>,
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

    registerObjectCollisions(objectId: number): void {
        const object = this.gameObjectRepository.get(objectId);
        this.boundingBoxRepository.addBoxValue(objectId, object.getBoundingBox());
    }

    registerObjectsCollisions(objectIds: number[]): void {
        for (const objectId of objectIds) {
            this.registerObjectCollisions(objectId);
        }
    }

    updateObjectCollisions(objectId: number, box: BoundingBox): void {
        this.boundingBoxRepository.updateBoxValue(objectId, box);
    }

    unregisterObjectCollisions(objectId: number): void {
        this.boundingBoxRepository.removeValue(objectId);
    }

    getOverlappingObjects(box: BoundingBox): number[] {
        return this.boundingBoxRepository.getBoxOverlappingValues(box);
    }

    objectsCompareLtr(first: GameObject, second: GameObject): number {
        return first.position.x - second.position.x;
    }

    objectsCompareRtl(first: GameObject, second: GameObject): number {
        return second.position.x - first.position.x;
    }

    objectsCompareUtd(first: GameObject, second: GameObject): number {
        return first.position.y - second.position.y;
    }

    objectsCompareDtu(first: GameObject, second: GameObject): number {
        return second.position.y - first.position.y;
    }

    isPositionCloserToDirection(newPosition: Point, oldPosition: Point, direction: Direction): boolean {
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

    snapObjectToBoundingBoxEdge(
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

    validateObjectMovement(objectId: number, position: Point): void {
        if (this.rulesMap === undefined) {
            throw new Error('Cannot validate object movement when rules map is not set');
        }

        const movingObject = this.gameObjectRepository.get(objectId);
        const movingDirection = movingObject.direction;
        const originalBoundingBox = movingObject.getBoundingBox();
        const movedBoundingBox = movingObject.getBoundingBox(position);
        const mergedBoundingBox = BoundingBoxUtils.combine(originalBoundingBox, movedBoundingBox);
        const overlappingObjectIds = this.getOverlappingObjects(mergedBoundingBox);
        const overlappingObjects = this.gameObjectRepository.getMultiple(overlappingObjectIds);

        let movementPreventingObject;
        const notifications = new Array<[CollisionEvent, GameObject]>();
        for (const overlappingObject of overlappingObjects) {
            if (objectId === overlappingObject.id) {
                continue;
            }

            if (overlappingObject.destroyed) {
                continue;
            }

            const rule = this.getRule(movingObject.type, overlappingObject.type);
            if (rule === undefined) {
                continue;
            }

            for (const result of rule.result) {
                if (result.type === CollisionResultEvent.PREVENT_MOVEMENT) {
                    const overlappingBoundingBox = overlappingObject.getBoundingBox();
                    const isAlreadyInside = BoundingBoxUtils.overlaps(originalBoundingBox,
                        overlappingBoundingBox);

                    let isCloser = true;
                    if (movementPreventingObject !== undefined) {
                        isCloser = this.isPositionCloserToDirection(overlappingObject.position,
                            movementPreventingObject.position, movingDirection);
                    }

                    if (!isAlreadyInside && isCloser) {
                        movementPreventingObject = overlappingObject;
                    }
                } else if (result.type === CollisionResultEvent.NOTIFY) {
                    notifications.push([result.name, overlappingObject]);
                }
            }
        }

        if (movementPreventingObject !== undefined) {
            const preventingBoundingBox = movementPreventingObject.getBoundingBox();
            this.snapObjectToBoundingBoxEdge(movingObject, position,
                preventingBoundingBox, movingDirection);
        }

        this.emitter.emit(CollisionServiceEvent.OBJECT_POSITION_ALLOWED, objectId, position);

        const preventedBoundingBox = movingObject.getBoundingBox(position);
        for (const [name, overlappingObject] of notifications) {
            const overlappingBoundingBox = overlappingObject.getBoundingBox();
            if (BoundingBoxUtils.overlapsEqual(preventedBoundingBox, overlappingBoundingBox)) {
                this.emitter.emit(name, objectId, overlappingObject.id);
            }
        }
    }

    calculateSnappedCoordinates(value: number, snapping: number): number {
        const overSnapping = value % snapping;
        let snapped = value - overSnapping;
        if (overSnapping > snapping / 2) {
            snapped += snapping;
        }
        return snapped;
    }

    validateObjectDirection(objectId: number, direction: Direction): void {
        const gameObject = this.gameObjectRepository.get(objectId);
        const oldDirection = gameObject.direction;

        this.emitter.emit(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED, objectId, direction);

        if (gameObject.properties.directionAxisSnapping !== undefined &&
                !DirectionUtils.isSameAxis(oldDirection, direction)) {
            let x = gameObject.position.x;
            let y = gameObject.position.y;
            if (DirectionUtils.isHorizontalAxis(direction)) {
                y = this.calculateSnappedCoordinates(gameObject.position.y,
                    gameObject.properties.directionAxisSnapping);
            } else {
                x = this.calculateSnappedCoordinates(gameObject.position.x,
                    gameObject.properties.directionAxisSnapping);
            }

            this.validateObjectMovement(objectId, {
                x: x,
                y: y,
            });
        }
    }
}
