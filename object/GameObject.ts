import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { Point } from '@/physics/point/Point';
import { Direction } from '../physics/Direction';
import { GameObjectType } from './GameObjectType';
import { AudioEffect, GameObjectProperties, ResourceMeta } from './GameObjectProperties';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { ComponentsInitialization } from '@/ecs/Component';

export interface GameObjectOptions {
    id?: number;
    type?: GameObjectType;
    direction?: Direction;
    movementSpeed?: number;
    movementDirection?: Direction | null;
}

export type GameObjectComponentsOptions = [GameObjectOptions, ComponentsInitialization];

export type PartialGameObjectOptions = Partial<GameObjectOptions>;

export class GameObject extends Entity {
    protected _audioMeta: ResourceMeta | undefined | null;
    protected _boundingBox: BoundingBox | undefined;
    protected _direction: Direction;
    protected _movementSpeed: number;
    graphicsDirty: boolean;

    properties;
    type: GameObjectType;
    movementDirection: Direction | null;

    graphicsRenderer?: any;
    audioRenderer?: any;

    constructor(options: GameObjectOptions, properties: GameObjectProperties, registry: Registry) {
        assert(options.type !== undefined, 'Cannot construct object without a type');
        assert(options.id !== undefined, 'Cannot construct object without an id');

        super(options.id, registry);

        this.properties = properties;
        this.type = options.type;
        this._direction = options.direction ?? Direction.UP;
        this._movementSpeed = options.movementSpeed ?? 0;
        this.movementDirection = options.movementDirection ?? null;
        this.graphicsDirty = true;
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            type: this.type,
            direction: this.direction,
            movementSpeed: this.movementSpeed,
            movementDirection: this.movementDirection,
        };
    }

    setOptions(options: PartialGameObjectOptions): void {
        if (options.direction !== undefined) this.direction = options.direction;
        if (options.movementSpeed !== undefined) this.movementSpeed = options.movementSpeed;
        if (options.movementDirection !== undefined) this.movementDirection = options.movementDirection;
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

    get movementSpeed(): number {
        return this._movementSpeed;
    }

    set movementSpeed(value: number) {
        this._movementSpeed = value;
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

    protected markGraphicsDirty(): void {
        this.graphicsDirty = true;
    }

    protected updateAudioMeta(): void {
        this._audioMeta = undefined;
    }

    get audioMeta(): ResourceMeta | undefined | null {
        if (this._audioMeta === undefined) {
            this.updateAudioMeta();
        }

        return this._audioMeta;
    }

    get boundingBox(): BoundingBox {
        const position = this.getComponent(PositionComponent);
        return {
            tl: {
                x: position.x,
                y: position.y,
            },
            br: {
                x: position.x + this.width,
                y: position.y + this.height,
            },
        };
    }

    get audioEffects(): AudioEffect[] | undefined {
        return this.properties.audioEffects;
    }

    getPositionedBoundingBox(position: Point): BoundingBox {
        return BoundingBoxUtils.create(position.x, position.y,
            position.x + this.width, position.y + this.height);
    }
}
