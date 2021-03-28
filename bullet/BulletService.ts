import GameObject from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { Direction } from '@/physics/Direction';
import Tank from '@/tank/Tank';
import MapRepository from '@/utils/MapRepository';
import { EventEmitter } from 'eventemitter3';

export enum BulletServiceEvent {
    TANK_BULLET_SPAWNED = 'tank-bullet-spawned',
}

export default class BulletService {
    private repository;
    emitter = new EventEmitter();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

    spawnBulletForTank(tankId: number): void {
        const object = this.repository.get(tankId);
        if (object.type !== GameObjectType.TANK) {
            throw new Error('Game object type is not tank');
        }

        const box = object.getBoundingBox();
        const objectCenterPosition = object.centerPosition;
        const properties = GameObjectProperties.getTypeProperties(GameObjectType.BULLET);

        let bulletY;
        let bulletX;
        switch (object.direction) {
            case Direction.UP:
                bulletY = object.position.y - properties.height;
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
                bulletX = object.position.x - properties.width;
                break;
            default:
                throw new Error('Invalid direction');
        }

        const tank = object as Tank;
        const bullet = new GameObject({
            type: GameObjectType.BULLET,
            direction: object.direction,
            position: {
                y: bulletY,
                x: bulletX,
            },
            requestedSpeed: tank.bulletSpeed,
        });

        this.emitter.emit(BulletServiceEvent.TANK_BULLET_SPAWNED, object.id, bullet);
    }
}
