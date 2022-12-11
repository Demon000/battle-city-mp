import { DirtyPositionComponent } from '@/components/DirtyPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { RelativePositionChildrenComponent } from '@/components/RelativePositionChildrenComponent';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { PluginContext } from './plugin';

export function unattachRelativeEntities(
    this: PluginContext,
    entity: Entity,
): void {
    const relativePositionChildrenComponent = entity
        .findComponent(RelativePositionChildrenComponent);
    if (relativePositionChildrenComponent === undefined) {
        return;
    }

    for (const childId of
        Object.keys(relativePositionChildrenComponent.ids)) {
        const child = this.registry.getEntityById(childId);
        unattachRelativeEntity.call(this, child);
    }
}

export function attachRelativeEntity(
    this: PluginContext,
    parent: Entity,
    child: Entity,
): void {
    const relativePositionComponent = child
        .findComponent(RelativePositionComponent);
    if (relativePositionComponent !== undefined) {
        unattachRelativeEntity.call(this, child);
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
    this: PluginContext,
    child: Entity,
): void {
    const relativePositionComponent = child
        .findComponent(RelativePositionComponent);
    if (relativePositionComponent === undefined) {
        return;
    }

    const parentId = relativePositionComponent.entityId;
    const parent = this.registry.getEntityById(parentId);

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
    this: PluginContext,
    entity: Entity,
): void {
    const relativePositionChildrenComponent = entity
        .findComponent(RelativePositionChildrenComponent);
    if (relativePositionChildrenComponent === undefined) {
        return;
    }

    for (const childId of
        Object.keys(relativePositionChildrenComponent.ids)) {
        const child = this.registry.getEntityById(childId);
        markDirtyRelativePosition(child);
    }
}

export function updateRelativePosition(
    this: PluginContext,
    entity: Entity,
    silent = false,
): void {
    const relativePositionComponent = entity
        .findComponent(RelativePositionComponent);
    if (relativePositionComponent === undefined) {
        return;
    }

    const parentEntity = this.registry
        .getEntityById(relativePositionComponent.entityId);
    const parentPosition = parentEntity.getComponent(PositionComponent);

    entity.updateComponent(PositionComponent, {
        x: parentPosition.x + relativePositionComponent.x,
        y: parentPosition.y + relativePositionComponent.y,
    }, {
        silent,
    });
}

export function initializeRelativePosition(
    this: PluginContext,
    entity: Entity,
): void {
    updateRelativePosition.call(this, entity, true);
}

export function processDirtyRelativePosition(
    this: PluginContext,
): void {
    for (const entity of this.registry
        .getEntitiesWithComponent(DirtyPositionComponent)) {

        updateRelativePosition.call(this, entity);

        entity.removeComponent(DirtyPositionComponent, {
            silent: true,
        });
    }
}
