import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import ObjectUtils from '@/utils/ObjectUtils';
import { Direction } from '../physics/Direction';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
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
    position: Point;
    direction: Direction;
    movementSpeed: number;
    movementDirection: Direction | null;
    spawnTime: number;

    collisionsDisabled = false;
    destroyed = false;

    graphicsRenderer?: any;
    audioRenderer?: any;

    constructor(options: GameObjectOptions) {
        if (options.type === undefined) {
            throw new Error('Cannot construct object without a type');
        }

        this.id = options.id ?? GameObject.globalId++;
        this.type = options.type;
        this.position = options.position ?? {x: 0, y: 0};
        this.direction = options.direction ?? Direction.UP;
        this.movementSpeed = options.movementSpeed ?? 0;
        this.movementDirection = options.movementDirection ?? null;
        this.spawnTime = Date.now();
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            direction: this.direction,
            movementSpeed: this.movementSpeed,
            movementDirection: this.movementDirection,
        };
    }

    toSaveOptions(): GameObjectOptions {
        return {
            type: this.type,
            position: this.position,
        };
    }

    setOptions(options: PartialGameObjectOptions): void {
        ObjectUtils.keysAssign(this, [
            'position',
            'direction',
            'movementSpeed',
            'movementDirection',
            'spawnTime',
        ], options);
    }

    get width(): number {
        return this.properties.width;
    }

    get height(): number {
        return this.properties.height;
    }

    get savable(): boolean | undefined {
        return this.properties.savable;
    }

    get directionAxisSnapping(): number | undefined {
        return this.properties.directionAxisSnapping;
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

    private get properties(): IGameObjectProperties {
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
        return [{}];
    }

    get audioMeta(): ResourceMeta | undefined | null {
        return undefined;
    }

    getBoundingBox(position=this.position): BoundingBox {
        return {
            tl: position,
            br: {
                y: position.y + this.height,
                x: position.x + this.width,
            },
        };
    }
}
