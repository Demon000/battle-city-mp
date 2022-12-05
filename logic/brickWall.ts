import { BulletComponent } from '@/components/BulletComponent';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { DirectionUtils } from '@/physics/collisions/DirectionUtils';
import { Direction } from '@/physics/Direction';
import { DirectionComponent } from '@/components/DirectionComponent';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { BulletPower } from '../subtypes/BulletPower';
import { Entity } from '@/ecs/Entity';

export function getBrickWallDestroyBox(
    brickWall: Entity,
    bullet: Entity,
): BoundingBox {
    const brickWallBoundingBox = BoundingBoxUtils.clone(
        brickWall.getComponent(BoundingBoxComponent),
    );

    const bulletCenterPosition =
        bullet.getComponent(CenterPositionComponent);
    const brickWallCenterPosition =
        brickWall.getComponent(CenterPositionComponent);
    const bulletDirection =
        bullet.getComponent(DirectionComponent).value;
    const bulletPower =
        bullet.getComponent(BulletComponent).power;

    const brickWallSize = brickWall.getComponent(SizeComponent);
    const brickWallWidth = brickWallSize.width;
    const brickWallHeight = brickWallSize.height;
    if (DirectionUtils.isHorizontalAxis(bulletDirection)) {
        if (bulletCenterPosition.y > brickWallCenterPosition.y) {
            brickWallBoundingBox.tl.y -= brickWallHeight;
            brickWallBoundingBox.br.y += brickWallHeight * 2;
        } else {
            brickWallBoundingBox.tl.y -= brickWallHeight * 2;
            brickWallBoundingBox.br.y += brickWallHeight;
        }

        if (bulletPower === BulletPower.HEAVY) {
            if (bulletDirection === Direction.RIGHT) {
                brickWallBoundingBox.br.x += brickWallWidth;
            } else {
                brickWallBoundingBox.tl.x -= brickWallWidth;
            }
        }
    } else {
        if (bulletCenterPosition.x > brickWallCenterPosition.x) {
            brickWallBoundingBox.tl.x -= brickWallWidth;
            brickWallBoundingBox.br.x += brickWallWidth * 2;
        } else {
            brickWallBoundingBox.tl.x -= brickWallWidth * 2;
            brickWallBoundingBox.br.x += brickWallWidth;
        }

        if (bulletPower === BulletPower.HEAVY) {
            if (bulletDirection === Direction.DOWN) {
                brickWallBoundingBox.br.y += brickWallHeight;
            } else {
                brickWallBoundingBox.tl.y -= brickWallHeight;
            }
        }
    }

    return brickWallBoundingBox;
}
