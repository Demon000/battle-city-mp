import { AudioEffect, GameObjectProperties, ResourceMeta } from './GameObjectProperties';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';
import { EntityId } from '@/ecs/EntityId';

export interface GameObjectOptions {
    id?: EntityId;
    type?: string;
    subtypes?: string[];
}

export class GameObject extends Entity {
    protected _audioMeta: ResourceMeta | undefined | null;

    properties;

    audioRenderer?: any;

    constructor(options: GameObjectOptions, properties: GameObjectProperties, registry: Registry) {
        assert(options.type !== undefined, 'Cannot construct object without a type');
        assert(options.id !== undefined, 'Cannot construct object without an id');

        super(registry, options.id, options.type, options.subtypes);

        this.properties = properties;
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
        };
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
