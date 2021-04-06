import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import { Direction } from '../physics/Direction';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import IGameObjectProperties, { IAudioEffect, ResourceMeta } from './IGameObjectProperties';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    position?: Point;
    direction?: Direction;
    movementSpeed?: number;
    movementDirection?: Direction | null;
}

export type PartialGameObjectOptions = Partial<GameObject>;

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
    audioEffectPanner: PannerNode | null = null;
    audioEffectBufferSource: AudioBufferSourceNode | null = null;
    _audioEffect?: IAudioEffect | null = null;

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

    setOptions(options: PartialGameObjectOptions): void {
        if (options.position !== undefined) {
            this.position = options.position;
        }

        if (options.direction !== undefined) {
            this.direction = options.direction;
        }

        if (options.movementSpeed !== undefined) {
            this.movementSpeed = options.movementSpeed;
        }

        if (options.movementDirection !== undefined) {
            this.movementDirection = options.movementDirection;
        }

        if (options.spawnTime !== undefined) {
            this.spawnTime = options.spawnTime;
        }
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

    get isMoving(): boolean {
        return this.movementSpeed > 0;
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

    // get audioEffect(): IAudioEffect | null | undefined {
    //     if (this._audioEffect !== null) {
    //         return this._audioEffect;
    //     }

    //     const audioEffects = GameObjectProperties.findAudioEffects(this);
    //     if (audioEffects.length === 0) {
    //         this._audioEffect = undefined;
    //     } else {
    //         const audioEffect =  GameObjectProperties.findAudioEffect(this);
    //         if (audioEffect === undefined) {
    //             return null;
    //         }

    //         this._audioEffect = audioEffect;
    //     }

    //     return this._audioEffect;
    // }

    get automaticDestroyTime(): number | undefined {
        return this.properties.automaticDestroyTime;
    }

    get graphicsMeta(): ResourceMeta[] {
        return [{
            direction: this.direction,
            position: this.position,
        }];
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
