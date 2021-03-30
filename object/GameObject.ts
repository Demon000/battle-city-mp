import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import { Direction } from '../physics/Direction';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import IGameObjectProperties, { IAudioEffect, ISprite } from './IGameObjectProperties';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    position: Point;
    direction?: Direction;
    requestedSpeed?: number;
    spawnTime?: number;
}

export default class GameObject {
    static globalId = 0;

    id: number;
    type: GameObjectType;
    position: Point;
    direction: Direction;
    requestedSpeed: number;
    spawnTime: number;
    destroyed = false;
    audioEffectPanner?: PannerNode;
    audioEffectBufferSource?: AudioBufferSourceNode;

    constructor(options: GameObjectOptions) {
        this.id = options.id ?? GameObject.globalId++;
        this.type = options.type ?? GameObjectType.ANY;
        this.direction = options.direction ?? Direction.UP;
        this.requestedSpeed = options.requestedSpeed ?? 0;
        this.position = options.position;
        this.spawnTime = options.spawnTime ?? Date.now();
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            direction: this.direction,
            requestedSpeed: this.requestedSpeed,
            spawnTime: this.spawnTime,
        };
    }

    setOptions(other: GameObject): void {
        this.position = other.position;
        this.direction = other.direction;
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

    get sprite(): ISprite | undefined {
        return GameObjectProperties.findSprite(this);
    }

    get audioEffect(): IAudioEffect | undefined {
        return GameObjectProperties.findAudioEffect(this);
    }

    get automaticDestroyTime(): number | undefined {
        return this.properties.automaticDestroyTime;
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
