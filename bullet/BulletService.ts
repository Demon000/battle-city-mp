import { BulletComponent } from '@/components/BulletComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxComponent } from '@/physics/bounding-box/BoundingBoxComponent';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { DirectionUtils } from '@/physics/collisions/DirectionUtils';
import { Direction } from '@/physics/Direction';
import { DirectionComponent } from '@/physics/DirectionComponent';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';
import { Tank } from '@/tank/Tank';
import { BulletPower } from './BulletPower';

export class BulletService {
    constructor(
        private gameObjectFactory: GameObjectFactory,
        private registry: Registry,
    ) {}

    getBulletBrickWallDestroyBox(bulletId: number, brickWallId: number): BoundingBox {
        const bullet = this.registry.getEntityById(bulletId);
        const brickWall = this.registry.getEntityById(brickWallId);
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

    createBulletForTank(tank: Tank): GameObject {
        const centerPosition = tank.getComponent(CenterPositionComponent);
        const direction = tank.getComponent(DirectionComponent);
        const bullet = this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.BULLET,
            subtypes: [tank.bulletPower],
            options: {
                movementDirection: direction.value,
                movementSpeed: tank.bulletSpeed,
            },
            components: {
                DirectionComponent: direction,
                BulletComponent: {
                    power: tank.bulletPower,
                },
                PlayerOwnedComponent: {
                    playerId: tank.playerId,
                },
                EntityOwnedComponent: {
                    entityId: tank.id,
                },
            },
        });

        const bulletSize = bullet.getComponent(SizeComponent);
        bullet.updateComponent(PositionComponent, {
            x: centerPosition.x - bulletSize.width / 2,
            y: centerPosition.y - bulletSize.height / 2,
        }, {
            silent: true,
        });

        return bullet;
    }
}
