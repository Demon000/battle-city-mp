import { DirtyPositionComponent } from '@/components/DirtyPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { RelativePositionChildrenComponent } from '@/components/RelativePositionChildrenComponent';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';

export function unattachRelativeEntities(
    registry: Registry,
    entity: Entity,
): void {
    const relativePositionChildrenComponent = entity
        .findComponent(RelativePositionChildrenComponent);
    if (relativePositionChildrenComponent === undefined) {
        return;
    }

    for (const childId of
        Object.keys(relativePositionChildrenComponent.ids)) {
        const child = registry.getEntityById(childId);
        unattachRelativeEntity(registry, child);
    }
}

export function attachRelativeEntity(
    registry: Registry,
    parent: Entity,
    child: Entity,
): void {
    const relativePositionComponent = child
        .findComponent(RelativePositionComponent);
    if (relativePositionComponent !== undefined) {
        unattachRelativeEntity(registry, child);
    }

    child.upsertComponent(RelativePositionComponent, {
        entityId: parent.id,
    });

    const relativePositionChildrenComponent = parent
        .getComponent(RelativePositionChildrenComponent);
    relativePositionChildrenComponent.ids[child.id] = true;
    relativePositionChildrenComponent.update({
        ids: relativePositionChildrenComponent.ids,
    });
}

export function unattachRelativeEntity(
    registry: Registry,
    child: Entity,
): void {
    const relativePositionComponent = child
        .findComponent(RelativePositionComponent);
    if (relativePositionComponent === undefined) {
        return;
    }

    const parentId = relativePositionComponent.entityId;
    const parent = registry.getEntityById(parentId);

    const relativePositionChildrenComponent = parent
        .getComponent(RelativePositionChildrenComponent);
    delete relativePositionChildrenComponent.ids[child.id];
    relativePositionChildrenComponent.update({
        ids: relativePositionChildrenComponent.ids,
    });

    relativePositionComponent.remove();
}

export function isAttachedRelativeEntity(entity: Entity): boolean {
    return entity.hasComponent(RelativePositionComponent);
}

function markDirtyRelativePosition(entity: Entity): void {
    if (!entity.hasComponent(RelativePositionComponent)) {
        return;
    }

    entity.upsertComponent(DirtyPositionComponent, undefined, {
        silent: true,
    });
}

export function markRelativeChildrenDirtyPosition(
    registry: Registry,
    entity: Entity,
): void {
    const relativePositionChildrenComponent = entity
        .findComponent(RelativePositionChildrenComponent);
    if (relativePositionChildrenComponent === undefined) {
        return;
    }

    for (const childId of
        Object.keys(relativePositionChildrenComponent.ids)) {
        const child = registry.getEntityById(childId);
        markDirtyRelativePosition(child);
    }
}

export function updateRelativePosition(
    registry: Registry,
    entity: Entity,
    silent = false,
): void {
    const relativePositionComponent = entity
        .findComponent(RelativePositionComponent);
    if (relativePositionComponent === undefined) {
        return;
    }

    const parentEntity = registry
        .getEntityById(relativePositionComponent.entityId);
    const parentPosition = parentEntity.getComponent(PositionComponent);

    entity.updateComponent(PositionComponent, {
        x: parentPosition.x + relativePositionComponent.x,
        y: parentPosition.y + relativePositionComponent.y,
    }, {
        silent,
    });
}

export function processDirtyRelativePosition(registry: Registry): void {
    for (const entity of registry
        .getEntitiesWithComponent(DirtyPositionComponent)) {

        updateRelativePosition(registry, entity);

        entity.removeComponent(DirtyPositionComponent, {
            silent: true,
        });
    }
}
