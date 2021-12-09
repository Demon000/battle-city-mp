import { AudioEffect, GameObjectProperties, ResourceMeta } from './GameObjectProperties';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';

export interface GameObjectOptions {
    id?: number;
    type?: string;
    subtypes?: string[];
}

export type PartialGameObjectOptions = Partial<GameObjectOptions>;

export class GameObject extends Entity {
    protected _audioMeta: ResourceMeta | undefined | null;
    graphicsDirty: boolean;

    properties;
    type: string;
    subtypes: string[];

    graphicsRenderer?: any;
    audioRenderer?: any;

    constructor(options: GameObjectOptions, properties: GameObjectProperties, registry: Registry) {
        assert(options.type !== undefined, 'Cannot construct object without a type');
        assert(options.id !== undefined, 'Cannot construct object without an id');

        super(registry, options.id, options.type, options.subtypes);

        this.properties = properties;
        this.type = options.type;
        this.subtypes = options.subtypes || [];
        this.graphicsDirty = true;
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
        };
    }

    setOptions(_options: PartialGameObjectOptions): void {
        // empty
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
