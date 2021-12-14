import { DestroyedComponent } from '@/components/DestroyedComponent';
import { DirectionAxisSnappingComponent } from '@/components/DirectionAxisSnappingComponent';
import { DirtyIsUnderBushComponent } from '@/components/DirtyIsUnderBushComponent';
import { IsUnderBushComponent } from '@/components/IsUnderBushComponent';
import { MovementMultipliersComponent } from '@/components/MovementMultipliersComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { GameObject } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { BoundingBox } from '../bounding-box/BoundingBox';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { BoundingBoxRepository } from '../bounding-box/BoundingBoxRepository';
import { BoundingBoxUtils } from '../bounding-box/BoundingBoxUtils';
import { DirtyBoundingBoxComponent } from '../../components/DirtyBoundingBoxComponent';
import { Direction } from '../Direction';
import { DirectionComponent } from '@/components/DirectionComponent';
import { Point } from '../point/Point';
import { PointUtils } from '../point/PointUtils';
import { PositionComponent } from '@/components/PositionComponent';
import { RelativePositionChildrenComponent } from '@/components/RelativePositionChildrenComponent';
import { RequestedPositionComponent } from '@/components/RequestedPositionComponent';
import { RequestedDirectionComponent } from '@/components/RequestedDirectionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { DirectionUtils } from './DirectionUtils';
import { DirtyCollisionsComponent } from '../../components/DirtyCollisionsComponent';
import { ICollisionRule, CollisionEvent, CollisionEvents, CollisionResultEvent } from './ICollisionRule';
import { EntityId } from '@/ecs/EntityId';
import { IsUnderBushTrackingComponent } from '@/components/IsUnderBushTrackingComponent';

export class CollisionService {
    private rulesMap?: Map<string, Map<string, ICollisionRule>>;

    emitter = new EventEmitter<CollisionEvents>();

    constructor(
        private boundingBoxRepository: BoundingBoxRepository<EntityId>,
        private registry: Registry,
        rules?: ICollisionRule[],
    ) {
        if (rules) {
            this.rulesMap = new Map<string, Map<string, ICollisionRule>>();

            for (const rule of rules) {
                for (const movingType of rule.movingTypes) {
                    let movingMap = this.rulesMap.get(movingType);
                    if (!movingMap) {
                        movingMap = new Map<string, ICollisionRule>();
                        this.rulesMap.set(movingType, movingMap);
                    }

                    for (const staticType of rule.staticTypes) {
                        movingMap.set(staticType, rule);
                    }
                }
            }
        }
    }

    private getRule(movingType: string, staticType: string): ICollisionRule | undefined {
        assert(this.rulesMap !== undefined,
            'Cannot call getRule with no rules supplied');

        const movingMap = this.rulesMap.get(movingType);
        if (movingMap === undefined) {
            return undefined;
        }

        return movingMap.get(staticType);
    }

    getOverlappingObjects(box: BoundingBox): Iterable<EntityId> {
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
        entity: Entity,
        position: Point,
        box: BoundingBox,
        direction: Direction,
    ): void {
        const size = entity.getComponent(SizeComponent);
        switch (direction) {
            case Direction.UP:
                position.y = box.br.y;
                break;
            case Direction.RIGHT:
                position.x = box.tl.x - size.width;
                break;
            case Direction.DOWN:
                position.y = box.tl.y - size.height;
                break;
            case Direction.LEFT:
                position.x = box.br.x;
                break;
        }
    }

    private updateObjectMovementModifiers(
        movingEntity: Entity,
        overlappingEntities: Iterable<Entity>,
    ): void {
        const movingMultipliers =
            movingEntity.findComponent(MovementMultipliersComponent);
        if (movingMultipliers === undefined) {
            return;
        }

        movingMultipliers.accelerationFactorMultiplier = 1;
        movingMultipliers.decelerationFactorMultiplier = 1;
        movingMultipliers.maxSpeedMultiplier = 1;
        movingMultipliers.typeMultipliersMarkedMap = {};

        for (const overlappingEntity of overlappingEntities) {
            const typeMultipliers =
                movingMultipliers.typeMultipliersMap[overlappingEntity.type];
            if (typeMultipliers === undefined) {
                continue;
            }

            if (movingMultipliers.typeMultipliersMarkedMap[movingEntity.type]) {
                continue;
            }

            movingMultipliers.typeMultipliersMarkedMap[movingEntity.type] = true;

            movingMultipliers.accelerationFactorMultiplier
                *= typeMultipliers.accelerationFactor;
            movingMultipliers.decelerationFactorMultiplier
                *= typeMultipliers.decelerationFactor;
            movingMultipliers.maxSpeedMultiplier
                *= typeMultipliers.maxSpeed;
        }
    }

    private _validateObjectMovement(
        movingObject: Entity,
        position: Point,
        direction?: Direction,
        trySnapping = true,
    ): void {
        assert(this.rulesMap !== undefined,
            'Cannot call validate object movement with no rules supplied');

        const movingObjectDirection =
            movingObject.getComponent(DirectionComponent).value;
        const movingDirection = direction ?? movingObjectDirection;
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
        const overlappingObjects = this.registry
            .getMultipleEntitiesById(overlappingObjectIds);

        let movementPreventingObject;
        const collidingObjectNotifications = new Array<[CollisionEvent, Entity]>();
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
        if (!trySnapping && movementPreventingObject !== undefined) {
            return;
        }

        const preventedBoundingBox = BoundingBoxUtils
            .reposition(originalBoundingBox, originalPosition, position);

        if (position.x === originalPosition.x
            && position.y === originalPosition.y) {
            return;
        }

        movingObject.updateComponent(PositionComponent, position);

        for (const [name, overlappingObject] of collidingObjectNotifications) {
            const overlappingBoundingBox = overlappingObject
                .getComponent(BoundingBoxComponent);
            if (BoundingBoxUtils.overlapsEqual(preventedBoundingBox,
                overlappingBoundingBox)) {
                this.emitter.emit(name, movingObject.id, overlappingObject.id,
                    position);
            }
        }

        this.updateObjectMovementModifiers(movingObject, overlappingObjects);
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

    validateObjectDirection(entity: Entity, direction: Direction): void {
        const directionComponent = entity.getComponent(DirectionComponent);
        const oldDirection = directionComponent.value;

        directionComponent.update({
            value: direction,
        });

        if (DirectionUtils.isSameAxis(oldDirection, direction)) {
            return;
        }

        const directionAxisSnappingComponent =
            entity.findComponent(DirectionAxisSnappingComponent);
        if (directionAxisSnappingComponent === undefined) {
            return;
        }

        const value = directionAxisSnappingComponent.value;
        const position = entity.getComponent(PositionComponent);
        const newPosition = PointUtils.clone(position);
        if (DirectionUtils.isHorizontalAxis(direction)) {
            newPosition.y = this.calculateSnappedCoordinates(position.y, value);
        } else {
            newPosition.x = this.calculateSnappedCoordinates(position.x, value);
        }

        this._validateObjectMovement(entity, newPosition, oldDirection, false);
    }

    processObjectsRequestedDirection(): void {
        for (const component of this.registry.getComponents(RequestedDirectionComponent)) {
            component.remove();

            this.validateObjectDirection(component.entity, component.value);
        }
    }

    findRelativePositionEntityWithType(
        entity: Entity,
        type: string,
    ): Entity | undefined {
        const relativePositionChildrenComponent = entity
            .findComponent(RelativePositionChildrenComponent);
        if (relativePositionChildrenComponent === undefined) {
            return undefined;
        }

        for (const childId of
            Object.keys(relativePositionChildrenComponent.ids)) {
            const child = this.registry.getEntityById(+childId);
            if (child.type === type) {
                return child;
            }
        }

        return undefined;
    }

    findOverlappingWithType(
        entity: Entity,
        type: string,
    ): Entity | undefined {
        const boundingBox = entity.getComponent(BoundingBoxComponent);
        const overlappingObjectIds = this.getOverlappingObjects(boundingBox);
        const overlappingObjects = this.registry
            .getMultipleEntitiesById(overlappingObjectIds);

        for (const overlappingObject of overlappingObjects) {
            if (overlappingObject.type === type) {
                return overlappingObject;
            }
        }

        return undefined;
    }

    private isOverlappingWithType(entity: Entity, type: string): boolean {
        return this.findOverlappingWithType(entity, type) !== undefined;
    }

    updateIsUnderBush(entity: Entity): void {
        if (!entity.hasComponent(IsUnderBushTrackingComponent)) {
            return;
        }

        const hasIsUnderBushComponent = entity.hasComponent(IsUnderBushComponent);
        const isUnderBush = this.isOverlappingWithType(entity, GameObjectType.BUSH);

        if (isUnderBush === hasIsUnderBushComponent) {
            return;
        }

        if (isUnderBush) {
            entity.addComponent(IsUnderBushComponent, undefined, {
                flags: ComponentFlags.LOCAL_ONLY,
            });
        } else {
            entity.removeComponent(IsUnderBushComponent);
        }
    }

    processObjectsDirtyIsUnderBush(): void {
        for (const component of
            this.registry.getComponents(DirtyIsUnderBushComponent)) {
            component.remove({
                silent: true,
            });

            const entity = component.entity;
            this.updateIsUnderBush(entity);
        }
    }

    markDirtyBoundingBox(entity: Entity): void {
        if (!entity.hasComponent(BoundingBoxComponent)) {
            return;
        }

        entity.upsertComponent(DirtyBoundingBoxComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
            silent: true,
        });
    }

    updateBoundingBox(entity: Entity): void {
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

        boundingBox.tl.x = position.x;
        boundingBox.tl.y = position.y;
        boundingBox.br.x = brx;
        boundingBox.br.y = bry;

        boundingBox.update({
            tl: boundingBox.tl,
            br: boundingBox.br,
        });
    }

    processObjectsDirtyBoundingBox(): void {
        for (const component of
            this.registry.getComponents(DirtyBoundingBoxComponent)) {
            component.remove({
                silent: true,
            });

            const entity = component.entity;
            this.updateBoundingBox(entity);
        }
    }

    markDirtyCollisions(entity: Entity): void {
        const node = this.boundingBoxRepository.findNode(entity.id);
        const boundingBox = entity.findComponent(BoundingBoxComponent);
        if (node !== undefined && boundingBox !== undefined
            && node.isFatBoxFitting(boundingBox)
            && !entity.hasComponent(DestroyedComponent)) {
            return;
        }

        entity.upsertComponent(DirtyCollisionsComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
            silent: true,
        });
    }

    processObjectDirtyCollisions(entity: Entity): void {
        const boundingBox = entity.findComponent(BoundingBoxComponent);
        if (boundingBox === undefined || entity.hasComponent(DestroyedComponent)) {
            this.boundingBoxRepository.removeValue(entity.id);
        } else if (this.boundingBoxRepository.hasNode(entity.id)) {
            this.boundingBoxRepository.updateBoxValue(entity.id,
                boundingBox);
        } else {
            this.boundingBoxRepository.addBoxValue(entity.id,
                boundingBox);
        }
    }

    processObjectsDirtyCollisions(): void {
        for (const component of this.registry.getComponents(DirtyCollisionsComponent)) {
            component.remove({
                silent: true,
            });

            this.processObjectDirtyCollisions(component.entity);
        }
    }

    clear(): void {
        this.boundingBoxRepository.clear();
    }
}
