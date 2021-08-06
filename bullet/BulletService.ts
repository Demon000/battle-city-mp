import { GameObject } from '@/object/GameObject';
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
import { MapRepository } from '@/utils/MapRepository';
import { Bullet, BulletOptions } from './Bullet';
import { BulletPower } from './BulletPower';

export class BulletService {
    constructor(
        private repository: MapRepository<number, GameObject>,
        private gameObjectFactory: GameObjectFactory,
    ) {}

    getBullet(bulletId: number): Bullet {
        const object = this.repository.get(bulletId);
        if (object.type !== GameObjectType.BULLET) {
            throw new Error('Game object type is not bullet');
        }

        return object as Bullet;
    }

    getBulletBrickWallDestroyBox(bulletId: number, brickWallId: number): BoundingBox {
        const bullet = this.getBullet(bulletId);
        const brickWall = this.repository.get(brickWallId);
        const brickWallBoundingBox = BoundingBoxUtils.clone(
            brickWall.getComponent(BoundingBoxComponent),
        );

        const bulletCenterPosition =
            bullet.getComponent(CenterPositionComponent);
        const brickWallCenterPosition =
            brickWall.getComponent(CenterPositionComponent);
        const bulletDirection =
            bullet.getComponent(DirectionComponent).value;

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

            if (bullet.power === BulletPower.HEAVY) {
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

            if (bullet.power === BulletPower.HEAVY) {
                if (bulletDirection === Direction.DOWN) {
                    brickWallBoundingBox.br.y += brickWallHeight;
                } else {
                    brickWallBoundingBox.tl.y -= brickWallHeight;
                }
            }
        }

        return brickWallBoundingBox;
    }

    createBulletForTank(tank: Tank): Bullet {
        const centerPosition = tank.getComponent(CenterPositionComponent);
        const direction = tank.getComponent(DirectionComponent);
        const bullet = this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.BULLET,
            movementDirection: direction.value,
            movementSpeed: tank.bulletSpeed,
            tankId: tank.id,
            playerId: tank.playerId,
            power: tank.bulletPower,
        } as BulletOptions, {
            DirectionComponent: direction,
        });

        const bulletSize = bullet.getComponent(SizeComponent);
        bullet.updateComponent(PositionComponent, {
            x: centerPosition.x - bulletSize.width / 2,
            y: centerPosition.y - bulletSize.height / 2,
        }, {
            silent: true,
        });

        return bullet as Bullet;
    }
}
