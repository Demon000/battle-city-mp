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
    constructor(options: GameObjectOptions, registry: Registry) {
        assert(options.type !== undefined, 'Cannot construct object without a type');
        assert(options.id !== undefined, 'Cannot construct object without an id');

        super(registry, options.id, options.type, options.subtypes);
    }

    toOptions(): GameObjectOptions {
        return {
            id: this.id,
        };
    }
}
