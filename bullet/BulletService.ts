import { GameObject } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { DirectionUtils } from '@/physics/collisions/DirectionUtils';
import { Direction } from '@/physics/Direction';
import { Tank } from '@/tank/Tank';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { Bullet } from './Bullet';
import { BulletPower } from './BulletPower';

export enum BulletServiceEvent {
    BULLET_SPAWNED = 'bullet-spawned',
}

interface BulletServiceEvents {
    [BulletServiceEvent.BULLET_SPAWNED]: (bullet: Bullet) => void,
}

export class BulletService {
    private repository;
    emitter = new EventEmitter<BulletServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

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
        const box = BoundingBoxUtils.clone(brickWall.boundingBox);

        const bulletCenter = bullet.centerPosition;
        const brickWallCenterPosition = brickWall.centerPosition;

        const brickWallWidth = brickWall.width;
        const brickWallHeight = brickWall.height;
        if (DirectionUtils.isHorizontalAxis(bullet.direction)) {
            if (bulletCenter.y > brickWallCenterPosition.y) {
                box.tl.y -= brickWallHeight;
                box.br.y += brickWallHeight * 2;
            } else {
                box.tl.y -= brickWallHeight * 2;
                box.br.y += brickWallHeight;
            }

            if (bullet.power === BulletPower.HEAVY) {
                if (bullet.direction === Direction.RIGHT) {
                    box.br.x += brickWallWidth;
                } else {
                    box.tl.x -= brickWallWidth;
                }
            }
        } else {
            if (bulletCenter.x > brickWallCenterPosition.x) {
                box.tl.x -= brickWallWidth;
                box.br.x += brickWallWidth * 2;
            } else {
                box.tl.x -= brickWallWidth * 2;
                box.br.x += brickWallWidth;
            }

            if (bullet.power === BulletPower.HEAVY) {
                if (bullet.direction === Direction.DOWN) {
                    box.br.y += brickWallHeight;
                } else {
                    box.tl.y -= brickWallHeight;
                }
            }
        }

        return box;
    }

    spawnBulletForTank(tank: Tank): void {
        const objectCenterPosition = tank.centerPosition;
        const bullet = new Bullet({
            direction: tank.direction,
            movementDirection: tank.direction,
            movementSpeed: tank.bulletSpeed,
            tankId: tank.id,
            playerId: tank.playerId,
            power: tank.bulletPower,
        });

        const bulletY = objectCenterPosition.y - bullet.height / 2;
        const bulletX = objectCenterPosition.x - bullet.width / 2;

        bullet.position = {
            y: bulletY,
            x: bulletX,
        };

        this.emitter.emit(BulletServiceEvent.BULLET_SPAWNED, bullet);
    }
}
