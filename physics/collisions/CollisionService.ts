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
import ICollisionRule, { CollisionResultType } from './ICollisionRule';

export enum CollisionServiceEvent {
    OBJECT_POSITION_ALLOWED = 'object-position-allowed',
    OBJECT_DIRECTION_ALLOWED = 'object-direction-allowed',
}

export default class CollisionService {
    private gameObjectRepository;
    private boundingBoxRepository;
    private rulesMap?: Map<GameObjectType, Map<GameObjectType, ICollisionRule>>;

    emitter = new EventEmitter();

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

    updateObjectCollisions(objectId: number): void {
        const object = this.gameObjectRepository.get(objectId);
        this.boundingBoxRepository.updateBoxValue(objectId, object.getBoundingBox());
    }

    unregisterObjectCollisions(objectId: number): void {
        this.boundingBoxRepository.removeValue(objectId);
    }

    getOverlappingObjects(box: BoundingBox): number[] {
        return this.boundingBoxRepository.getBoxOverlappingValues(box);
    }

    validateObjectMovement(objectId: number, position: Point): boolean {
        if (this.rulesMap === undefined) {
            throw new Error('Cannot validate object movement when rules map is not set');
        }

        let preventMovement = false;

        const movingObject = this.gameObjectRepository.get(objectId);
        const movedBoundingBox = movingObject.getBoundingBox(position);
        const overlappingObjectIds = this.getOverlappingObjects(movedBoundingBox);
        for (const overlappingObjectId of overlappingObjectIds) {
            if (objectId === overlappingObjectId) {
                continue;
            }

            const overlappingObject = this.gameObjectRepository.get(overlappingObjectId);
            if (overlappingObject.destroyed) {
                continue;
            }

            const rule = this.getRule(movingObject.type, overlappingObject.type);
            if (rule === undefined) {
                continue;
            }

            for (let result of rule.result) {
                if (result.type === CollisionResultType.PREVENT_MOVEMENT) {
                    preventMovement = true;
                } else if (result.type === CollisionResultType.NOTIFY) {
                    this.emitter.emit(result.name, objectId, position, overlappingObjectId);
                }
            }
        }

        if (preventMovement) {
            return true;
        }

        this.emitter.emit(CollisionServiceEvent.OBJECT_POSITION_ALLOWED, objectId, position);

        return false;
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
        if (gameObject.properties.directionAxisSnapping !== undefined &&
                !DirectionUtils.isSameAxis(gameObject.direction, direction)) {
            const snappedX = this.calculateSnappedCoordinates(gameObject.position.x, gameObject.properties.directionAxisSnapping);
            const snappedY = this.calculateSnappedCoordinates(gameObject.position.y, gameObject.properties.directionAxisSnapping);

            this.validateObjectMovement(objectId, {
                x: snappedX,
                y: snappedY,
            });
        }

        this.emitter.emit(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED, objectId, direction);
    }
}
