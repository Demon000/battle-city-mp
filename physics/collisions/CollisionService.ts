import { DirectionAxisSnappingComponent } from '@/components/DirectionAxisSnappingComponent';
import { MovementMultipliersComponent } from '@/components/MovementMultipliersComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { BoundingBox } from '../bounding-box/BoundingBox';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { BoundingBoxRepository } from '../bounding-box/BoundingBoxRepository';
import { BoundingBoxUtils } from '../bounding-box/BoundingBoxUtils';
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
import { CollisionEvents, CollisionRule, CollisionRuleType } from './CollisionRule';
import { EntityId } from '@/ecs/EntityId';
import { LazyIterable } from '@/utils/LazyIterable';
import { CollisionTrackingComponent, CollisionTrackingData } from '@/components/CollisionTrackingComponent';
import { CollisionRulesComponent } from '@/components/CollisionRulesComponent';
import { DirtyCollisionsAddComponent } from '@/components/DirtyCollisionsAddComponent';
import { DirtyCollisionsUpdateComponent } from '@/components/DirtyCollisionsUpdateComponent';
import { DirtyCollisionsRemoveComponent } from '@/components/DirtyCollisionsRemoveComponent';
import { IterableUtils } from '@/utils/IterableUtils';
import { FatBoundingBoxComponent } from '@/components/FatBoundingBoxComponent';

export enum DirtyCollisionType {
    ADD,
    UPDATE,
    REMOVE,
}

export class CollisionService {
    emitter = new EventEmitter<CollisionEvents>();

    constructor(
        private boundingBoxRepository: BoundingBoxRepository<EntityId>,
        private registry: Registry,
    ) {}

    private getRules(
        movingEntity: Entity,
        staticEntityType: string,
    ): CollisionRule[] | undefined {
        const collisionRulesComponent = movingEntity
            .findComponent(CollisionRulesComponent);

        return collisionRulesComponent?.rules[staticEntityType];
    }

    private getRuleWithType(
        movingEntity: Entity,
        staticEntityType: string,
        type: CollisionRuleType,
    ): CollisionRule | undefined {
        const rules = this.getRules(movingEntity, staticEntityType);
        if (rules === undefined) {
            return undefined;
        }

        for (const rule of rules) {
            if (rule.type === type) {
                return rule;
            }
        }

        return undefined;
    }

    getOverlappingEntities(box: BoundingBox): Iterable<EntityId> {
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

    private snapEntityToBoundingBoxEdge(
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

    private getCollisionTrackingEntities(
        data: CollisionTrackingData,
        type: string,
    ): Iterable<EntityId> {
        return Object.keys(data[type]);
    }

    private getCollisionTrackingTypeValue(
        data: CollisionTrackingData,
        type: string,
    ): boolean {
        const entities = this.getCollisionTrackingEntities(data, type);
        return !IterableUtils.isEmpty(entities);
    }

    private copyCollisionTrackingTypes(
        sourceData: CollisionTrackingData,
        targetData: CollisionTrackingData,
    ): void {
        for (const key of Object.keys(sourceData)) {
            targetData[key] = {};
        }
    }

    private addCollisionTrackingEntity(
        data: CollisionTrackingData,
        entity: Entity,
    ): void {
        assert(data[entity.type] !== undefined);
        data[entity.type][entity.id] = true;
    }

    private hasCollisionTrackingEntity(
        data: CollisionTrackingData,
        entity: Entity,
    ): boolean {
        return data[entity.type][entity.id] !== undefined;
    }

    private updateMovementModifiers(entity: Entity): void {
        const movingMultipliers =
            entity.findComponent(MovementMultipliersComponent);
        if (movingMultipliers === undefined) {
            return;
        }

        const collisionTracking =
            entity.findComponent(CollisionTrackingComponent);
        if (collisionTracking === undefined) {
            return;
        }

        movingMultipliers.accelerationFactorMultiplier = 1;
        movingMultipliers.decelerationFactorMultiplier = 1;
        movingMultipliers.maxSpeedMultiplier = 1;
        movingMultipliers.typeMultipliersMarkedMap = {};

        for (const type of Object.keys(collisionTracking.values)) {
            const typeMultipliers = movingMultipliers.typeMultipliersMap[type];
            if (typeMultipliers === undefined ||
                !this.getCollisionTrackingTypeValue(collisionTracking.values, type)) {
                continue;
            }

            if (movingMultipliers.typeMultipliersMarkedMap[type]) {
                continue;
            }

            movingMultipliers.typeMultipliersMarkedMap[type] = true;

            movingMultipliers.accelerationFactorMultiplier
                *= typeMultipliers.accelerationFactor;
            movingMultipliers.decelerationFactorMultiplier
                *= typeMultipliers.decelerationFactor;
            movingMultipliers.maxSpeedMultiplier
                *= typeMultipliers.maxSpeed;
        }
    }

    private _validateEntityMovement(
        movingEntity: Entity,
        position: Point,
        direction?: Direction,
        trySnapping = true,
    ): void {
        const movingEntityDirection =
            movingEntity.getComponent(DirectionComponent).value;
        const movingDirection = direction ?? movingEntityDirection;
        const originalBoundingBox = movingEntity
            .getComponent(BoundingBoxComponent);
        const originalPosition = movingEntity
            .getComponent(PositionComponent);
        const movedBoundingBox = BoundingBoxUtils
            .reposition(originalBoundingBox, originalPosition, position);
        const mergedBoundingBox = BoundingBoxUtils
            .combine(originalBoundingBox, movedBoundingBox);
        const overlappingEntityIds = this
            .getOverlappingEntities(mergedBoundingBox);
        const overlappingEntities = this.registry
            .getEntitiesById(overlappingEntityIds);
        const collisionTracking = movingEntity
            .findComponent(CollisionTrackingComponent);

        const newCollisionTrackingValues: CollisionTrackingData = {};
        if (collisionTracking !== undefined) {
            this.copyCollisionTrackingTypes(collisionTracking.values,
                newCollisionTrackingValues);
        }

        let movementPreventingEntity;
        for (const overlappingEntity of overlappingEntities) {
            if (movingEntity.id === overlappingEntity.id) {
                continue;
            }

            const rules = this.getRules(movingEntity, overlappingEntity.type);
            if (rules === undefined) {
                continue;
            }

            for (const rule of rules) {
                const overlappingBoundingBox = overlappingEntity
                    .getComponent(BoundingBoxComponent);
                let coversMinimumVolume = true;

                if (rule.type === CollisionRuleType.TRACK
                    && rule.minimumVolume !== undefined) {
                    const intersectionBoundingBox = BoundingBoxUtils
                        .intersect(overlappingBoundingBox, movedBoundingBox);
                    coversMinimumVolume = BoundingBoxUtils
                        .volume(intersectionBoundingBox) >= rule.minimumVolume;
                }

                if (rule.type === CollisionRuleType.PREVENT_MOVEMENT) {
                    const isAlreadyInside = BoundingBoxUtils
                        .overlaps(originalBoundingBox, overlappingBoundingBox);

                    let isCloser = true;
                    if (movementPreventingEntity !== undefined) {
                        const overlappingPosition =
                            overlappingEntity.getComponent(PositionComponent);
                        const movementPreventingPosition =
                            movementPreventingEntity.getComponent(PositionComponent);
                        isCloser = this.isPositionCloserToDirection(overlappingPosition,
                            movementPreventingPosition, movingDirection);
                    }

                    if (!isAlreadyInside && isCloser) {
                        movementPreventingEntity = overlappingEntity;
                    }
                } else if (rule.type === CollisionRuleType.TRACK
                    && collisionTracking !== undefined
                    /*
                     * If already covering minimum volume, do not disable until
                     * exiting.
                     */
                    && (coversMinimumVolume
                        || this.hasCollisionTrackingEntity(
                            collisionTracking.values, overlappingEntity))
                ) {
                    this.addCollisionTrackingEntity(newCollisionTrackingValues,
                        overlappingEntity);
                }
            }
        }

        /*
         * We found a movement preventing entity, snap to its edge.
         * This usually works, because we can only move towards an entity.
         * But there's an edge case where the moving entity has turned in another
         * direction, and we try to snap it so he can fit between blocks with ease,
         * in which case we cannot try to snap it again to the edge of the movement
         * movement preventing entity.
         */
        if (movementPreventingEntity !== undefined) {
            const preventingBoundingBox = movementPreventingEntity
                .getComponent(BoundingBoxComponent);
            this.snapEntityToBoundingBoxEdge(movingEntity, position,
                preventingBoundingBox, movingDirection);
        }

        /*
         * If we can't try snapping to the movement preventing entity's edge,
         * then the position we're trying to move to is inside the movement preventing entity,
         * which means it is invalid, and we shouldn't update the entity position.
         */
        if (!trySnapping && movementPreventingEntity !== undefined) {
            return;
        }

        if (position.x === originalPosition.x
            && position.y === originalPosition.y) {
            return;
        }

        this.setPosition(movingEntity, position);

        if (collisionTracking === undefined)
            return;

        let collisionTrackingChanged = false;

        for (const type of Object.keys(collisionTracking.values)) {
            const oldEntityIds = this.getCollisionTrackingEntities(collisionTracking.values, type);
            const newEntityIds = this.getCollisionTrackingEntities(newCollisionTrackingValues, type);

            if (IterableUtils.equals(oldEntityIds, newEntityIds)) {
                continue;
            }

            collisionTrackingChanged = true;

            const rule = this.getRuleWithType(movingEntity, type,
                CollisionRuleType.TRACK);
            assert(rule !== undefined
                && rule.type === CollisionRuleType.TRACK);

            if (rule.entryEvent !== undefined) {
                for (const entityId of newEntityIds) {
                    if (entityId in oldEntityIds) {
                        continue;
                    }

                    const staticEntity = this.registry.findEntityById(entityId);
                    if (staticEntity === undefined) {
                        continue;
                    }
                    this.emitter.emit(rule.entryEvent, movingEntity, staticEntity);
                    if (this.registry.findEntityById(movingEntity.id) === undefined) {
                        return;
                    }
                }
            }

            if (rule.exitEvent !== undefined) {
                for (const entityId of oldEntityIds) {
                    if (entityId in newEntityIds) {
                        continue;
                    }

                    const staticEntity = this.registry.findEntityById(entityId);
                    if (staticEntity === undefined) {
                        continue;
                    }
                    this.emitter.emit(rule.exitEvent, movingEntity, staticEntity);
                    if (this.registry.findEntityById(movingEntity.id) === undefined) {
                        return;
                    }
                }
            }
        }

        if (collisionTrackingChanged) {
            collisionTracking.update({
                values: newCollisionTrackingValues,
            });

            this.updateMovementModifiers(movingEntity);
        }
    }

    setPosition(entity: Entity, position: Point): void {
        entity.updateComponent(PositionComponent, position);
    }

    processRequestedPosition(): void {
        for (const component of this.registry.getComponents(RequestedPositionComponent)) {
            if (component.detached) {
                continue;
            }

            const entity = component.entity;
            this._validateEntityMovement(entity, component, undefined, true);

            if (component.detached) {
                continue;
            }

            component.remove();
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

    validateDirection(entity: Entity, direction: Direction): void {
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

        this._validateEntityMovement(entity, newPosition, oldDirection, false);
    }

    processRequestedDirection(): void {
        for (const component of this.registry.getComponents(RequestedDirectionComponent)) {
            this.validateDirection(component.entity, component.value);

            component.remove();
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
            const child = this.registry.getEntityById(childId);
            if (child.type === type) {
                return child;
            }
        }

        return undefined;
    }

    findMultipleOverlappingWithType(
        boundingBox: BoundingBox,
        type: string,
    ): Entity[] {
        const entityIds = this.getOverlappingEntities(boundingBox);
        const entities = this.registry.getEntitiesById(entityIds);

        return LazyIterable.from(entities)
            .filter(o => o.type === type)
            .toArray();
    }

    findOverlappingWithType(
        boundingBox: BoundingBox,
        type: string,
    ): Entity | undefined {
        return this.findMultipleOverlappingWithType(boundingBox, type)[0];
    }

    updateBoundingBox(entity: Entity, silent = false): void {
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
        }, {
            silent,
        });
    }

    markDirtyCollisions(entity: Entity, type: DirtyCollisionType): void {
        let clazz;

        switch (type) {
            case DirtyCollisionType.ADD:
                clazz = DirtyCollisionsAddComponent;
                break;
            case DirtyCollisionType.UPDATE:
                clazz = DirtyCollisionsUpdateComponent;
                break;
            case DirtyCollisionType.REMOVE:
                clazz = DirtyCollisionsRemoveComponent;
                break;
        }

        entity.upsertSharedComponent(clazz, {
            silent: true,
        });
    }

    removeCollisions(entity: Entity): void {
        if (this.boundingBoxRepository.hasNode(entity.id)) {
            this.boundingBoxRepository.removeValue(entity.id);
        }
    }

    processDirtyCollisions(): void {
        for (const entity of
            this.registry.getEntitiesWithComponent(DirtyCollisionsAddComponent)) {

            const boundingBox = entity.getComponent(BoundingBoxComponent);
            const fatGrowFactor = entity.findComponent(FatBoundingBoxComponent)?.factor;
            this.boundingBoxRepository.addBoxValue(entity.id, boundingBox, fatGrowFactor);

            entity.removeComponent(DirtyCollisionsAddComponent);
        }

        for (const entity of
            this.registry.getEntitiesWithComponent(DirtyCollisionsUpdateComponent)) {

            const boundingBox = entity.getComponent(BoundingBoxComponent);
            this.boundingBoxRepository.updateBoxValue(entity.id, boundingBox);

            entity.removeComponent(DirtyCollisionsUpdateComponent);
        }

        for (const entity of
            this.registry.getEntitiesWithComponent(DirtyCollisionsRemoveComponent)) {

            this.removeCollisions(entity);

            entity.removeComponent(DirtyCollisionsRemoveComponent);
        }
    }

    clear(): void {
        this.boundingBoxRepository.clear();
    }
}
