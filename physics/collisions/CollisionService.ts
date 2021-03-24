import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectProperties';
import MapRepository from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import BoundingBox from '../bounding-box/BoundingBox';
import BoundingBoxRepository from '../bounding-box/BoundingBoxRepository';
import { Direction } from '../Direction';
import Point from '../point/Point';
import ICollisionRule, { CollisionResultType } from './ICollisionRule';

export enum CollisionServiceEvent {
    OBJECT_MOVE_ALLOWED = 'object-move-allowed',
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

    private getRule(movingType: GameObjectType, staticType: GameObjectType): ICollisionRule {
        if (!this.rulesMap) {
            throw new Error('getRule called but no rules supplied');
        }

        const movingMap = this.rulesMap.get(movingType);
        if (!movingMap) {
            throw new Error('Invalid moving type');
        }

        const rule = movingMap.get(staticType);
        if (!rule) {
            throw new Error('Invalid static type');
        }

        return rule;
    }

    registerObjectCollisions(objectId: number): void {
        const object = this.gameObjectRepository.get(objectId);
        console.log(object);
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
        console.log(objectId);
        this.boundingBoxRepository.removeValue(objectId);
    }

    getOverlappingObjects(box: BoundingBox): number[] {
        return this.boundingBoxRepository.getBoxOverlappingValues(box);
    }

    validateObjectMovement(objectId: number, position: Point): boolean {
        if (!this.rulesMap) {
            return false;
        }

        let preventMovement = false;

        const movingObject = this.gameObjectRepository.get(objectId);
        const movedBoundingBox = movingObject.getBoundingBox(position);
        const overlappingObjectIds = this.getOverlappingObjects(movedBoundingBox);
        for (const overlappingObjectId of overlappingObjectIds) {
            if (objectId === overlappingObjectId) {
                continue;
            }

            const overlappingObject = this.gameObjectRepository.get(objectId);
            const rule = this.getRule(movingObject.type, overlappingObject.type);

            for (let result of rule.result) {
                if (typeof(result) == 'function') {
                    result = result(objectId, position, overlappingObjectId);
                }
                
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

        this.emitter.emit(CollisionServiceEvent.OBJECT_MOVE_ALLOWED, objectId, position);

        return false;
    }

    validateObjectDirection(objectId: number, direction: Direction): void {
        this.emitter.emit(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED, objectId, direction);
    }
}
