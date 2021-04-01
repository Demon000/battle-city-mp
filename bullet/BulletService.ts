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

export enum BulletServiceEvent {
    BULLET_SPAWNED = 'bullet-spawned',
}

export default class BulletService {
    private repository;
    emitter = new EventEmitter();

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
        const bullet = this.repository.get(bulletId);
        const brickWall = this.repository.get(brickWallId);
        const box = brickWall.getBoundingBox();

        const bulletCenterPosition = bullet.centerPosition;
        const brickWallCenterPosition = brickWall.centerPosition;

        if (DirectionUtils.isHorizontalAxis(bullet.direction)) {
            const brickWallHeight = brickWall.properties.height;
            if (bulletCenterPosition.y > brickWallCenterPosition.y) {
                box.tl.y -= brickWallHeight;
                box.br.y += brickWallHeight * 2;
            } else {
                box.tl.y -= brickWallHeight * 2;
                box.br.y += brickWallHeight;
            }
        } else {
            const brickWallWidth = brickWall.properties.width;
            if (bulletCenterPosition.x > brickWallCenterPosition.x) {
                box.tl.x -= brickWallWidth;
                box.br.x += brickWallWidth * 2;
            } else {
                box.tl.x -= brickWallWidth * 2;
                box.br.x += brickWallWidth;
            }
        }

        return box;
    }

    spawnBulletForTank(tank: Tank): void {
        const box = tank.getBoundingBox();
        const objectCenterPosition = tank.centerPosition;
        const properties = GameObjectProperties.getTypeProperties(GameObjectType.BULLET);

        let bulletY;
        let bulletX;
        switch (tank.direction) {
            case Direction.UP:
                bulletY = tank.position.y - properties.height;
                bulletX = objectCenterPosition.x - properties.width / 2;
                break;
            case Direction.RIGHT:
                bulletY = objectCenterPosition.y - properties.height / 2;
                bulletX = box.br.x;
                break;
            case Direction.DOWN:
                bulletY = box.br.y;
                bulletX = objectCenterPosition.x - properties.width / 2;
                break;
            case Direction.LEFT:
                bulletY = objectCenterPosition.y - properties.height / 2;
                bulletX = tank.position.x - properties.width;
                break;
            default:
                throw new Error('Invalid direction');
        }

        const bullet = new Bullet({
            type: GameObjectType.BULLET,
            direction: tank.direction,
            position: {
                y: bulletY,
                x: bulletX,
            },
            requestedSpeed: tank.bulletSpeed,
            tankId: tank.id,
        });

        this.emitter.emit(BulletServiceEvent.BULLET_SPAWNED, bullet);
    }
}
