import { Component, ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { ComponentEmitOptions, RegistryComponentEvent } from '@/ecs/Registry';
import { GameEvent } from '@/game/GameEvent';
import { GameEventBatcher } from '@/game/GameEventBatcher';
import { assert } from '@/utils/assert';

export function batchEntityRegistered(
    batcher: GameEventBatcher,
    entity: Entity,
) {
    batcher.addBroadcastEvent([
        GameEvent.ENTITY_REGISTERED,
        {
            id: entity.id,
            type: entity.type,
            subtypes: entity.subtypes,
            components: entity.getComponentsData({
                withoutFlags: ComponentFlags.LOCAL_ONLY,
            }),
        },
    ]);
}

export function batchEntityDestroyed(
    batcher: GameEventBatcher,
    entity: Entity,
): void {
    batcher.addBroadcastEvent([GameEvent.ENTITY_UNREGISTERED, entity.id]);
}

export function batchComponentChanged<C extends Component<C>>(
    batcher: GameEventBatcher,
    event: RegistryComponentEvent,
    component: C,
    data?: any,
    options?: ComponentEmitOptions,
): void {
    if (component.flags & ComponentFlags.LOCAL_ONLY
        || event === RegistryComponentEvent.COMPONENT_ADDED
            && options?.register
        || event === RegistryComponentEvent.COMPONENT_BEFORE_REMOVE
            && options?.destroy) {
        return;
    }

    let gameEvent;
    switch (event) {
        case RegistryComponentEvent.COMPONENT_ADDED:
            gameEvent = GameEvent.ENTITY_COMPONENT_ADDED;
            break;
        case RegistryComponentEvent.COMPONENT_UPDATED:
            gameEvent = GameEvent.ENTITY_COMPONENT_UPDATED;
            break;
        case RegistryComponentEvent.COMPONENT_BEFORE_REMOVE:
            gameEvent = GameEvent.ENTITY_COMPONENT_REMOVED;
            break;
        default:
            assert(false);
    }

    if (gameEvent === GameEvent.ENTITY_COMPONENT_REMOVED) {
        batcher.addBroadcastEvent([
            gameEvent,
            component.entity.id,
            component.clazz.tag,
        ]);
    } else if (gameEvent === GameEvent.ENTITY_COMPONENT_ADDED) {
        batcher.addBroadcastEvent([
            gameEvent,
            component.entity.id,
            component.clazz.tag,
            component.getData(),
        ]);
    } else if (gameEvent === GameEvent.ENTITY_COMPONENT_UPDATED) {
        batcher.addBroadcastEvent([
            gameEvent,
            component.entity.id,
            component.clazz.tag,
            data,
        ]);
    }
}
