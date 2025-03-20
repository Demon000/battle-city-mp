import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { TeleporterComponent } from '@/components/TeleporterComponent';
import { PluginContext } from './plugin';
import { createSpawnEffect } from './spawn-effect';
import { EntityCollideTeleporterComponent } from '@/components/EntityCollideTeleporterComponent';

export function onEntityCollideTeleporter(
    this: PluginContext,
    component: EntityCollideTeleporterComponent,
): void {
    const entity = component.entity;
    const entityPosition = entity.getComponent(PositionComponent);
    const teleporter = this.registry.getEntityById(component.entityId);
    const target = teleporter.getComponent(TeleporterComponent).target;
    const teleporterPosition = teleporter.getComponent(PositionComponent);
    const teleporterSize = teleporter.getComponent(SizeComponent);

    const targetPosition = {
        x: target.x - teleporterSize.width / 2,
        y: target.y - teleporterSize.height / 2,
    };

    const position = {
        x: targetPosition.x - teleporterPosition.x + entityPosition.x,
        y: targetPosition.y - teleporterPosition.y + entityPosition.y,
    };

    createSpawnEffect(this.entityFactory, teleporterPosition);
    createSpawnEffect(this.entityFactory, targetPosition);
    this.collisionService.setPosition(entity, position);
}
