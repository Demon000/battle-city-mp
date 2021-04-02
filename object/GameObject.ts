import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import { Direction } from '../physics/Direction';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import IGameObjectProperties, { IAudioEffect, ISprite, ResourceMeta } from './IGameObjectProperties';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    position: Point;
    direction?: Direction;
    movementSpeed?: number;
    movementDirection?: Direction;
    spawnTime?: number;
}

export default class GameObject {
    static globalId = 0;

    id: number;
    type: GameObjectType;
    _position: Point;
    _direction: Direction;
    movementSpeed: number;
    movementDirection?: Direction;
    spawnTime: number;
    destroyed = false;
    audioEffectPanner?: PannerNode;
    audioEffectBufferSource?: AudioBufferSourceNode;
    invalidateSprite = true;
    _sprite?: ISprite;

    constructor(options: GameObjectOptions) {
        this.id = options.id ?? GameObject.globalId++;
        this.type = options.type ?? GameObjectType.ANY;
        this._position = options.position;
        this._direction = options.direction ?? Direction.UP;
        this.movementSpeed = options.movementSpeed ?? 0;
        this.movementDirection = options.movementDirection;
        this.spawnTime = options.spawnTime ?? Date.now();
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            type: this.type,
            position: this._position,
            direction: this.direction,
            movementSpeed: this.movementSpeed,
            movementDirection: this.movementDirection,
            spawnTime: this.spawnTime,
        };
    }

    setOptions(other: GameObject): void {
        this.position = other.position;
        this.direction = other.direction;
        this.movementSpeed = other.movementSpeed;
        this.movementDirection = other.movementDirection;
        this.spawnTime = other.spawnTime;
    }

    set direction(direction: Direction) {
        this._direction = direction;
        this.invalidateSprite = true;
    }

    get direction(): Direction {
        return this._direction;
    }

    set position(position: Point) {
        this._position = position;
        this.invalidateSprite = true;
    }

    get position(): Point {
        return this._position;
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

    get maxMovementSpeed(): number {
        return this.movementSpeed;
    }

    get accelerationFactor(): number {
        return 0;
    }

    get delecerationFactor(): number {
        return 0;
    }

    get sprite(): ISprite | undefined {
        if (this.invalidateSprite) {
            this._sprite = GameObjectProperties.findSprite(this);
            this.invalidateSprite = false;
        }

        return this._sprite;
    }

    get hasAudioEffects(): boolean {
        return !!GameObjectProperties.findAudioEffects(this).length;
    }

    get audioEffect(): IAudioEffect | undefined {
        return GameObjectProperties.findAudioEffect(this);
    }

    get automaticDestroyTime(): number | undefined {
        return this.properties.automaticDestroyTime;
    }

    isMatchingMeta(_meta: ResourceMeta): boolean {
        return false;
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
