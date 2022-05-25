import { DestroyedComponent } from '@/components/DestroyedComponent';
import { DirectionAxisSnappingComponent } from '@/components/DirectionAxisSnappingComponent';
import { MovementMultipliersComponent } from '@/components/MovementMultipliersComponent';
import { ComponentFlags } from '@/ecs/Component';
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
import { DirtyCollisionsComponent, DirtyCollisionType } from '../../components/DirtyCollisionsComponent';
import { CollisionEvents, CollisionRule, CollisionRuleType } from './CollisionRule';
import { EntityId } from '@/ecs/EntityId';
import { CollisionTrackingComponent } from '@/components/CollisionTrackingComponent';
import { CollisionRulesComponent } from '@/components/CollisionRulesComponent';

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

        for (const [type, value] of Object.entries(collisionTracking.values)) {
            const typeMultipliers = movingMultipliers.typeMultipliersMap[type];
            if (typeMultipliers === undefined || value === false) {
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
            .getMultipleEntitiesById(overlappingEntityIds);
        const collisionTracking = movingEntity
            .findComponent(CollisionTrackingComponent);

        const newCollisionTrackingValues: Record<string, EntityId | false> = {};
        if (collisionTracking !== undefined) {
            for (const key of Object.keys(collisionTracking.values)) {
                newCollisionTrackingValues[key] = false;
            }
        }

        let movementPreventingEntity;
        for (const overlappingEntity of overlappingEntities) {
            if (movingEntity.id === overlappingEntity.id) {
                continue;
            }

            if (overlappingEntity.hasComponent(DestroyedComponent)) {
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
                        || collisionTracking.values[overlappingEntity.type]
                            !== false)
                    /*
                     * Keep the first colliding entity.
                     */
                    && newCollisionTrackingValues[overlappingEntity.type]
                        === false) {
                    newCollisionTrackingValues[overlappingEntity.type]
                        = overlappingEntity.id;
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
            if (collisionTracking.values[type]
                === newCollisionTrackingValues[type]) {
                continue;
            }

            collisionTrackingChanged = true;

            if ((collisionTracking.values[type] === false
                    && newCollisionTrackingValues[type] === false)
                || (collisionTracking.values[type] !== false
                    && newCollisionTrackingValues[type] !== false)) {
                continue;
            }

            const rule = this.getRuleWithType(movingEntity, type,
                CollisionRuleType.TRACK);
            assert(rule !== undefined
                && rule.type === CollisionRuleType.TRACK);

            if (newCollisionTrackingValues[type] !== false
                && rule.entryEvent !== undefined) {
                this.emitter.emit(rule.entryEvent, movingEntity.id,
                    newCollisionTrackingValues[type] as EntityId);
            } else if (newCollisionTrackingValues[type] === false
                && rule.exitEvent !== undefined) {
                this.emitter.emit(rule.exitEvent, movingEntity.id,
                    collisionTracking.values[type] as EntityId);
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
            const entity = component.entity;
            this._validateEntityMovement(entity, component, undefined, true);

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
            const child = this.registry.getEntityById(+childId);
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
        const entities = this.registry.getMultipleEntitiesById(entityIds);

        return Array.from(entities)
            .filter(o => o.type === type);
    }

    findOverlappingWithType(
        boundingBox: BoundingBox,
        type: string,
    ): Entity | undefined {
        return this.findMultipleOverlappingWithType(boundingBox, type)[0];
    }

    private isOverlappingWithType(
        boundingBox: BoundingBox,
        type: string,
    ): boolean {
        return this.findOverlappingWithType(boundingBox, type) !== undefined;
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
        const dirtyCollisionsComponent = entity
            .findComponent(DirtyCollisionsComponent);

        if (dirtyCollisionsComponent !== undefined) {
            if (dirtyCollisionsComponent.type === DirtyCollisionType.ADD
                && type === DirtyCollisionType.UPDATE) {
                return;
            }

            if (dirtyCollisionsComponent.type === DirtyCollisionType.REMOVE) {
                return;
            }

            if (dirtyCollisionsComponent.type === type) {
                return;
            }
        }

        entity.upsertComponent(DirtyCollisionsComponent, {
            type,
        }, {
            flags: ComponentFlags.LOCAL_ONLY,
            silent: true,
        });
    }

    processEntityDirtyCollision(component: DirtyCollisionsComponent): void {
        const entity = component.entity;
        const boundingBox = entity.findComponent(BoundingBoxComponent);
        const hasNode = this.boundingBoxRepository.hasNode(entity.id);

        if (component.type === DirtyCollisionType.ADD
            || (component.type === DirtyCollisionType.UPDATE && !hasNode)) {
            assert(boundingBox !== undefined);
            this.boundingBoxRepository.addBoxValue(entity.id,
                boundingBox);
        } else if (component.type === DirtyCollisionType.UPDATE) {
            assert(boundingBox !== undefined);
            this.boundingBoxRepository.updateBoxValue(entity.id,
                boundingBox);
        } else if (component.type === DirtyCollisionType.REMOVE && hasNode) {
            this.boundingBoxRepository.removeValue(entity.id);
        }
    }

    processDirtyCollisions(): void {
        for (const component of
            this.registry.getComponents(DirtyCollisionsComponent)) {

            this.processEntityDirtyCollision(component);

            component.remove({
                silent: true,
            });
        }
    }

    clear(): void {
        this.boundingBoxRepository.clear();
    }
}
