import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
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

    protected _graphicsMeta: ResourceMeta[] | undefined | null;
    protected _audioMeta: ResourceMeta | undefined | null;
    protected _position: Point;
    protected _direction: Direction;
    protected _movementSpeed: number;
    protected _isMoving: boolean;
    graphicsMetaUpdated = false;

    id: number;
    type: GameObjectType;
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
        this._position = options.position ?? {x: 0, y: 0};
        this._direction = options.direction ?? Direction.UP;
        this._movementSpeed = options.movementSpeed ?? 0;
        this._isMoving = this._movementSpeed > 0;
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
        if (options.position !== undefined) this.position = options.position;
        if (options.direction !== undefined) this.direction = options.direction;
        if (options.movementSpeed !== undefined) this.movementSpeed = options.movementSpeed;
        if (options.movementDirection !== undefined) this.movementDirection = options.movementDirection;
        if (options.spawnTime !== undefined) this.spawnTime = options.spawnTime;
    }

    get position(): Point {
        return this._position;
    }

    set position(value: Point) {
        this._position = value;
    }

    get width(): number {
        return this.properties.width;
    }

    get height(): number {
        return this.properties.height;
    }

    get direction(): Direction {
        return this._direction;
    }

    set direction(value: Direction) {
        this._direction = value;
    }

    get savable(): boolean | undefined {
        return this.properties.savable;
    }

    get directionAxisSnapping(): number | undefined {
        return this.properties.directionAxisSnapping;
    }

    get movementSpeed(): number {
        return this._movementSpeed;
    }

    set movementSpeed(value: number) {
        this._movementSpeed = value;

        const isMoving = value > 0;
        if (this.isMoving !== isMoving) {
            this.isMoving = isMoving;
        }
    }

    get isMoving(): boolean {
        return this._isMoving;
    }

    set isMoving(value: boolean) {
        this._isMoving = value;
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

    protected updateGraphicsMeta(): void {
        this._graphicsMeta = [{}];
    }

    protected markGraphicsMetaUpdated(): void {
        this.updateGraphicsMeta();
        this.graphicsMetaUpdated = true;
    }

    protected updateAudioMeta(): void {
        this._audioMeta = undefined;
    }

    get graphicsMeta(): ResourceMeta[] | undefined | null {
        if (this._graphicsMeta === undefined) {
            this.markGraphicsMetaUpdated();
        }

        return this._graphicsMeta;
    }

    get audioMeta(): ResourceMeta | undefined | null {
        if (this._audioMeta === undefined) {
            this.updateAudioMeta();
        }

        return this._audioMeta;
    }

    getBoundingBox(position=this._position): BoundingBox {
        return {
            tl: position,
            br: {
                y: position.y + this.height,
                x: position.x + this.width,
            },
        };
    }
}
