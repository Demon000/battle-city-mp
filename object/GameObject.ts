import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import now from 'performance-now';
import { Direction } from '../physics/Direction';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import IGameObjectProperties from './IGameObjectProperties';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    position: Point;
    direction?: Direction;
    requestedDirection?: Direction;
    requestedSpeed?: number;
    spawnTime?: number;
}

export default class GameObject {
    static globalId = 0;

    id: number;
    type: GameObjectType;
    position: Point;
    direction: Direction;
    requestedDirection: Direction;
    requestedSpeed: number;
    spawnTime: number;

    constructor(options: GameObjectOptions) {
        this.id = options.id ?? GameObject.globalId++;
        this.type = options.type ?? GameObjectType.ANY;
        this.direction = options.direction ?? Direction.UP;
        this.requestedDirection = options.requestedDirection ?? Direction.UP;
        this.requestedSpeed = options.requestedSpeed ?? 0;
        this.position = options.position;
        this.spawnTime = options.spawnTime ?? now();
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            direction: this.direction,
            requestedDirection: this.requestedDirection,
            requestedSpeed: this.requestedSpeed,
            spawnTime: this.spawnTime,
        };
    }

    setOptions(other: GameObject): void {
        this.position = other.position;
        this.direction = other.direction;
        this.requestedDirection = other.requestedDirection;
        this.requestedSpeed = other.requestedSpeed;
        this.spawnTime = other.spawnTime;
    }

    get centerPosition(): Point {
        return {
            x: this.position.x + this.properties.width / 2,
            y: this.position.y + this.properties.height / 2,
        };
    }

    get properties(): IGameObjectProperties {
        return GameObjectProperties.getTypeProperties(this.type);
    }

    get movementSpeed(): number {
        return this.properties.speed ?? 0;
    }

    getBoundingBox(position=this.position): BoundingBox {
        return {
            tl: position,
            br: {
                y: position.y + this.properties.height,
                x: position.x + this.properties.width,
            },
        };
    }
}
