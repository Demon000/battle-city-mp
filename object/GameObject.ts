import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import { Direction } from '../physics/Direction';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType, SavableGameObjectTypes } from './GameObjectType';
import IGameObjectProperties, { ResourceMeta } from './IGameObjectProperties';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    position?: Point;
    direction?: Direction;
    movementSpeed?: number;
    movementDirection?: Direction | null;
    spawnTime?: number;
}

export type PartialGameObjectOptions = Partial<GameObjectOptions>;

export default class GameObject {
    static globalId = 0;

    id: number;
    type: GameObjectType;
    _position: Point;
    _direction: Direction;
    movementSpeed: number;
    movementDirection: Direction | null;
    spawnTime: number;

    destroyed = false;

    graphicsRenderer?: any;

    constructor(options: GameObjectOptions) {
        this.id = options.id ?? GameObject.globalId++;
        this.type = options.type ?? GameObjectType.ANY;
        this._position = options.position ?? {x: 0, y: 0};
        this._direction = options.direction ?? Direction.UP;
        this.movementSpeed = options.movementSpeed ?? 0;
        this.movementDirection = options.movementDirection ?? null;
        this.spawnTime = Date.now();
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            type: this.type,
            position: this._position,
            direction: this.direction,
            movementSpeed: this.movementSpeed,
            movementDirection: this.movementDirection,
        };
    }

    toSaveOptions(): PartialGameObjectOptions | undefined {
        if (!SavableGameObjectTypes.includes(this.type)) {
            return undefined;
        }

        return {
            type: this.type,
            position: this._position,
        };
    }

    setOptions(options: PartialGameObjectOptions): void {
        this.position = options.position ?? this.position;
        this.direction = options.direction ?? this.direction;
        this.movementSpeed = options.movementSpeed ?? this.movementSpeed;
        this.movementDirection = options.movementDirection ?? this.movementDirection;
        this.spawnTime = options.spawnTime ?? this.spawnTime;
    }

    set direction(direction: Direction) {
        this._direction = direction;
    }

    get direction(): Direction {
        return this._direction;
    }

    set position(position: Point) {
        this._position = position;
    }

    get position(): Point {
        return this._position;
    }

    get width(): number {
        return this.properties.width;
    }

    get height(): number {
        return this.properties.height;
    }

    get isMoving(): boolean {
        return this.movementSpeed > 0;
    }

    get centerPosition(): Point {
        return {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height / 2,
        };
    }

    get properties(): IGameObjectProperties {
        return GameObjectProperties.getTypeProperties(this.type);
    }

    get maxMovementSpeed(): number {
        return this.movementSpeed;
    }

    get accelerationFactor(): number {
        return 0;
    }

    get decelerationFactor(): number {
        return 0;
    }

    get automaticDestroyTime(): number | undefined {
        return this.properties.automaticDestroyTime;
    }

    get graphicsMeta(): ResourceMeta[] | undefined | null {
        return [{
            direction: this.direction,
            position: this.position,
        }];
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return undefined;
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
