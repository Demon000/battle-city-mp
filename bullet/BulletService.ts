import GameObject from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import DirectionUtils from '@/physics/collisions/DirectionUtils';
import { Direction } from '@/physics/Direction';
import Tank from '@/tank/Tank';
import MapRepository from '@/utils/MapRepository';
import { EventEmitter } from 'eventemitter3';
import Bullet from './Bullet';
import { BulletPower } from './BulletPower';

export enum BulletServiceEvent {
    BULLET_SPAWNED = 'bullet-spawned',
}

interface BulletServiceEvents {
    [BulletServiceEvent.BULLET_SPAWNED]: (bullet: Bullet) => void,
}

export default class BulletService {
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
        const box = brickWall.getBoundingBox();

        const bulletCenter = bullet.centerPosition;
        const brickWallCenterPosition = brickWall.centerPosition;

        const brickWallWidth = brickWall.properties.width;
        const brickWallHeight = brickWall.properties.height;
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
        const properties = GameObjectProperties.getTypeProperties(GameObjectType.BULLET);

        let bulletY = objectCenterPosition.y - properties.height / 2;
        let bulletX = objectCenterPosition.x - properties.width / 2;

        const bullet = new Bullet({
            type: GameObjectType.BULLET,
            direction: tank.direction,
            movementDirection: tank.direction,
            position: {
                y: bulletY,
                x: bulletX,
            },
            movementSpeed: tank.bulletSpeed,
            tankId: tank.id,
            power: tank.bulletPower,
        });

        this.emitter.emit(BulletServiceEvent.BULLET_SPAWNED, bullet);
    }
}
