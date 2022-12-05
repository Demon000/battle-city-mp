import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { TeleporterComponent } from '@/components/TeleporterComponent';
import { Entity } from '@/ecs/Entity';
import { PluginContext } from './plugin';
import { createSpawnEffect } from './spawn-effect';

export function onEntityCollideTeleporter(
    this: PluginContext,
    entity: Entity,
    teleporter: Entity,
): void {
    const size = entity.getComponent(SizeComponent);
    const target = teleporter.getComponent(TeleporterComponent).target;
    const teleporterPosition = teleporter.getComponent(PositionComponent);
    const teleporterSize = teleporter.getComponent(SizeComponent);

    const targetPosition = {
        x: target.x - teleporterSize.width / 2,
        y: target.y - teleporterSize.height / 2,
    };
    const position = {
        x: target.x - size.width / 2,
        y: target.y - size.height / 2,
    };

    createSpawnEffect(this.entityFactory, teleporterPosition);
    createSpawnEffect(this.entityFactory, targetPosition);
    this.collisionService.setPosition(entity, position);
}
