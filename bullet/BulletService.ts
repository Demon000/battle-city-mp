import { GameObject } from '@/object/GameObject';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxComponent } from '@/physics/bounding-box/BoundingBoxComponent';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { DirectionUtils } from '@/physics/collisions/DirectionUtils';
import { Direction } from '@/physics/Direction';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
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
        const boundingBox = BoundingBoxUtils.clone(
            brickWall.getComponent(BoundingBoxComponent),
        );

        const bulletCenterPosition =
            bullet.getComponent(CenterPositionComponent);
        const brickWallCenterPosition =
            brickWall.getComponent(CenterPositionComponent);

        const brickWallWidth = brickWall.width;
        const brickWallHeight = brickWall.height;
        if (DirectionUtils.isHorizontalAxis(bullet.direction)) {
            if (bulletCenterPosition.y > brickWallCenterPosition.y) {
                boundingBox.tl.y -= brickWallHeight;
                boundingBox.br.y += brickWallHeight * 2;
            } else {
                boundingBox.tl.y -= brickWallHeight * 2;
                boundingBox.br.y += brickWallHeight;
            }

            if (bullet.power === BulletPower.HEAVY) {
                if (bullet.direction === Direction.RIGHT) {
                    boundingBox.br.x += brickWallWidth;
                } else {
                    boundingBox.tl.x -= brickWallWidth;
                }
            }
        } else {
            if (bulletCenterPosition.x > brickWallCenterPosition.x) {
                boundingBox.tl.x -= brickWallWidth;
                boundingBox.br.x += brickWallWidth * 2;
            } else {
                boundingBox.tl.x -= brickWallWidth * 2;
                boundingBox.br.x += brickWallWidth;
            }

            if (bullet.power === BulletPower.HEAVY) {
                if (bullet.direction === Direction.DOWN) {
                    boundingBox.br.y += brickWallHeight;
                } else {
                    boundingBox.tl.y -= brickWallHeight;
                }
            }
        }

        return boundingBox;
    }

    createBulletForTank(tank: Tank): Bullet {
        const centerPosition = tank.getComponent(CenterPositionComponent);
        const bullet = this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.BULLET,
            direction: tank.direction,
            movementDirection: tank.direction,
            movementSpeed: tank.bulletSpeed,
            tankId: tank.id,
            playerId: tank.playerId,
            power: tank.bulletPower,
        } as BulletOptions);

        bullet.updateComponent(PositionComponent, {
            x: centerPosition.x - bullet.width / 2,
            y: centerPosition.y - bullet.height / 2,
        }, {
            silent: true,
        });

        return bullet as Bullet;
    }
}
