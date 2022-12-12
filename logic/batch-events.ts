import { Component, ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { ComponentEmitOptions, RegistryComponentEvent } from '@/ecs/Registry';
import { GameEvent } from '@/game/GameEvent';
import { assert } from '@/utils/assert';
import { PluginContext } from './plugin';

export function batchEntityRegistered(
    this: PluginContext,
    entity: Entity,
) {
    this.batcher.addBroadcastEvent([
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
    this: PluginContext,
    entity: Entity,
): void {
    this.batcher.addBroadcastEvent([GameEvent.ENTITY_UNREGISTERED, entity.id]);
}

export function batchComponentChanged<C extends Component>(
    this: PluginContext,
    component: C,
    options: ComponentEmitOptions,
    data: any,
): void {
    let event = options.event;

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
        this.batcher.addBroadcastEvent([
            gameEvent,
            component.entity.id,
            component.clazz.tag,
        ]);
    } else if (gameEvent === GameEvent.ENTITY_COMPONENT_ADDED) {
        this.batcher.addBroadcastEvent([
            gameEvent,
            component.entity.id,
            component.clazz.tag,
            component.getData(),
        ]);
    } else if (gameEvent === GameEvent.ENTITY_COMPONENT_UPDATED) {
        this.batcher.addBroadcastEvent([
            gameEvent,
            component.entity.id,
            component.clazz.tag,
            data,
        ]);
    }
}
