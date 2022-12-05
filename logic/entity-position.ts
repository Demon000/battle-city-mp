import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { Entity } from '@/ecs/Entity';
import { Point } from '@/physics/point/Point';

export function setEntityPosition(entity: Entity, position: Point): void {
    entity.upsertComponent(PositionComponent, position);
}

export function updateCenterPosition(entity: Entity, silent = false): void {
    const centerPosition = entity.getComponent(CenterPositionComponent);
    const position = entity.getComponent(PositionComponent);
    const size = entity.getComponent(SizeComponent);

    const x = position.x + size.width / 2;
    const y = position.y + size.height / 2;
    if (x === centerPosition.x && y === centerPosition.y) {
        return;
    }

    centerPosition.update({
        x,
        y,
    }, {
        silent,
    });
}
