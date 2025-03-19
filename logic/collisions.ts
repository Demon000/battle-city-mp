import { Entity } from '@/ecs/Entity';
import { DirtyCollisionType } from '@/physics/collisions/CollisionService';
import { PluginContext } from './plugin';

export function removeCollisions(
    this: PluginContext,
    entity: Entity,
): void {
    this.collisionService.removeCollisions(entity);
}

export function updateBoundingBox(
    this: PluginContext,
    entity: Entity,

): void {
    this.collisionService.updateBoundingBox(entity);
}

export function initializeBoundingBox(
    this: PluginContext,
    entity: Entity,
): void {
    this.collisionService.updateBoundingBox(entity, true);
}

export function markDirtyAddCollisions(
    this: PluginContext,
    entity: Entity,
): void {
    this.collisionService.markDirtyCollisions(entity,
        DirtyCollisionType.ADD);
}

export function markDirtyUpdateCollisions(
    this: PluginContext,
    entity: Entity,
): void {
    this.collisionService.markDirtyCollisions(entity,
        DirtyCollisionType.UPDATE);
}

export function markDirtyRemoveCollisions(
    this: PluginContext,
    entity: Entity,
): void {
    this.collisionService.markDirtyCollisions(entity,
        DirtyCollisionType.REMOVE);
}

export function markDirtyCollisionTracking(
    this: PluginContext,
    entity: Entity,
): void {
    this.collisionService.markDirtyCollisionTracking(entity);
}
