import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import now from 'performance-now';
import { Direction } from '../physics/Direction';
import GameObjectProperties, { GameObjectType } from './GameObjectProperties';
import IGameObjectProperties from './IGameObjectProperties';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    position: Point;
    direction?: Direction;
    requestedDirection?: Direction;
    isMoving?: boolean;
    spawnTime?: number;
}

export default class GameObject {
    static globalId = 0;

    id: number;
    type: GameObjectType;
    position: Point;
    direction: Direction;
    requestedDirection: Direction;
    isMoving: boolean;
    spawnTime: number;

    constructor(options: GameObjectOptions) {
        this.id = options.id ?? GameObject.globalId++;
        this.type = options.type ?? GameObjectType.ANY;
        this.direction = options.direction ?? Direction.UP;
        this.requestedDirection = options.requestedDirection ?? Direction.UP;
        this.isMoving = options.isMoving ?? false;
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
            isMoving: this.isMoving,
            spawnTime: this.spawnTime,
        };
    }

    setOptions(other: GameObject): void {
        this.position = other.position;
        this.direction = other.direction;
        this.requestedDirection = other.requestedDirection;
        this.isMoving = other.isMoving;
        this.spawnTime = other.spawnTime;
    }

    get properties(): IGameObjectProperties {
        return GameObjectProperties.getTypeProperties(this.type);
    }

    get speed(): number {
        return 0;
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
