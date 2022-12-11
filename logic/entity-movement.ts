import { DirectionComponent } from '@/components/DirectionComponent';
import { IsMovingComponent } from '@/components/IsMovingComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { MovementConfigComponent } from '@/components/MovementConfigComponent';
import { MovementMultipliersComponent } from '@/components/MovementMultipliersComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { RequestedDirectionComponent } from '@/components/RequestedDirectionComponent';
import { RequestedPositionComponent } from '@/components/RequestedPositionComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { Direction } from '@/physics/Direction';
import { PointUtils } from '@/physics/point/PointUtils';

export function setMovementDirection(
    entity: Entity,
    direction: Direction | undefined | null,
): void {
    const movement = entity.getComponent(MovementComponent);

    direction = direction === undefined ? null : direction;

    if (movement.direction === direction) {
        return;
    }

    movement.update({
        direction,
    });
}

function processEntityDirection(entity: Entity): void {
    const movement = entity.getComponent(MovementComponent);
    const direction = entity.getComponent(DirectionComponent).value;
    if (movement.direction !== null && direction !== movement.direction) {
        entity.upsertComponent(RequestedDirectionComponent, {
            value: movement.direction,
        });
    }
}

function processMovementSpeed(entity: Entity, delta: number): void {
    const movement = entity.getComponent(MovementComponent);
    const movementConfig = entity.findComponent(MovementConfigComponent);
    const multipliers = entity.findComponent(MovementMultipliersComponent);

    let accelerationFactor = movementConfig?.accelerationFactor ?? 0;
    let decelerationFactor = movementConfig?.decelerationFactor ?? 0;
    let maxSpeed = movementConfig?.maxSpeed ?? 0;
    if (multipliers !== undefined) {
        accelerationFactor *= multipliers.accelerationFactorMultiplier;
        decelerationFactor *= multipliers.decelerationFactorMultiplier;
        maxSpeed *= multipliers.maxSpeedMultiplier;
    }

    let newMovementSpeed = movement.speed;
    if (movement.direction === null || maxSpeed < newMovementSpeed) {
        newMovementSpeed -= maxSpeed * decelerationFactor * delta;
        newMovementSpeed = Math.max(0, newMovementSpeed);
    } else if (newMovementSpeed < maxSpeed) {
        newMovementSpeed += maxSpeed * accelerationFactor * delta;
        newMovementSpeed = Math.min(newMovementSpeed, maxSpeed);
    }

    if (newMovementSpeed === movement.speed) {
        return;
    }

    movement.update({
        speed: newMovementSpeed,
    });
}

function processEntityMovement(entity: Entity, delta: number): void {
    processMovementSpeed(entity, delta);

    const movement = entity.getComponent(MovementComponent);
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

    entity.upsertComponent(RequestedPositionComponent, position);
}

export function updateIsMoving(entity: Entity): void {
    const hasIsMovingComponent = entity.hasComponent(IsMovingComponent);
    const movement = entity.getComponent(MovementComponent);
    const isMoving = movement.speed > 0 || movement.direction !== null;

    if (isMoving === hasIsMovingComponent) {
        return;
    }

    if (isMoving) {
        entity.addComponent(IsMovingComponent);
    } else {
        entity.removeComponent(IsMovingComponent);
    }
}

export function processDirection(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(IsMovingComponent)) {
        processEntityDirection(entity);
    }
}

export function processMovement(registry: Registry, delta: number): void {
    for (const entity of registry.getEntitiesWithComponent(IsMovingComponent)) {
        processEntityMovement(entity, delta);
    }
}
