import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { Entity } from '@/ecs/Entity';
import { Point } from '@/physics/point/Point';

export function setEntityPosition(entity: Entity, position: Point): void {
    entity.upsertComponent(PositionComponent, position);
}

export function entityCenterPosition(entity: Entity): Point {
    const position = entity.getComponent(PositionComponent);
    const size = entity.getComponent(SizeComponent);

    return {
        x: position.x + size.width / 2,
        y: position.y + size.height / 2,
    };
}
