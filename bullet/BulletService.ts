import GameObject from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
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
