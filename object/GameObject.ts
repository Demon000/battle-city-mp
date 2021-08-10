import { Direction } from '../physics/Direction';
import { AudioEffect, GameObjectProperties, ResourceMeta } from './GameObjectProperties';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';

export interface GameObjectOptions {
    id?: number;
    type?: string;
    subtypes?: string[];
    movementSpeed?: number;
    movementDirection?: Direction | null;
}

export type PartialGameObjectOptions = Partial<GameObjectOptions>;

export class GameObject extends Entity {
    protected _audioMeta: ResourceMeta | undefined | null;
    protected _movementSpeed: number;
    graphicsDirty: boolean;

    properties;
    type: string;
    subtypes?: string[];
    movementDirection: Direction | null;

    graphicsRenderer?: any;
    audioRenderer?: any;

    constructor(options: GameObjectOptions, properties: GameObjectProperties, registry: Registry) {
        assert(options.type !== undefined, 'Cannot construct object without a type');
        assert(options.id !== undefined, 'Cannot construct object without an id');

        super(registry, options.id, options.type, options.subtypes);

        this.properties = properties;
        this.type = options.type;
        this.subtypes = options.subtypes;
        this._movementSpeed = options.movementSpeed ?? 0;
        this.movementDirection = options.movementDirection ?? null;
        this.graphicsDirty = true;
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
            subtypes: this.subtypes,
            movementSpeed: this.movementSpeed,
            movementDirection: this.movementDirection,
        };
    }

    setOptions(options: PartialGameObjectOptions): void {
        if (options.movementSpeed !== undefined) this.movementSpeed = options.movementSpeed;
        if (options.movementDirection !== undefined) this.movementDirection = options.movementDirection;
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

    get audioEffects(): AudioEffect[] | undefined {
        return this.properties.audioEffects;
    }
}
