import { Component, ComponentClassType } from '@/ecs/Component';
import { RegistryComponentCommonEventFn, RegistryComponentCommonEventWithDataFn as RegistryComponentCommonEventDataFn, RegistryComponentEvent, RegistryComponentEventFn, RegistryComponentEventWithDataFn, RegistryEvent, RegistryEventFn } from '@/ecs/Registry';
import { PluginContext } from '@/logic/plugin';

type PluginContextFn<
    F extends (...args: any[]) => any
> = (
    this: PluginContext,
    ...args: Parameters<F>
) => ReturnType<F>;

type AddArgFn<
    F extends (...args: any[]) => any,
    FN extends (...args: any[]) => any,
> = (
    this: PluginContext,
    ...args: [FN, ...Parameters<F>]
) => ReturnType<F>;

type ToEntityOr<T> = T | {
    toEntity: true;
    fns: PluginContextFn<RegistryEventFn>[];
};

export type EventHandler<
    C extends Component<C>,
    CT = ComponentClassType<C>,
>
=
{
    event: RegistryEvent.ENTITY_REGISTERED
            | RegistryEvent.ENTITY_BEFORE_DESTROY;
    fns: PluginContextFn<RegistryEventFn>[];
}
|
({
    event: RegistryComponentEvent.COMPONENT_INITIALIZED
            | RegistryComponentEvent.COMPONENT_ADDED
            | RegistryComponentEvent.COMPONENT_BEFORE_REMOVE;
    component?: CT,
} & ToEntityOr<{
    fns: PluginContextFn<RegistryComponentEventFn<C>>[];
}>)
|
({
    event: RegistryComponentEvent.COMPONENT_UPDATED;
    component?: CT,
} & ToEntityOr<{
    fns: PluginContextFn<RegistryComponentEventWithDataFn<C>>[];
}>)
|
({
    event: RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE;
    component?: CT,
} & ToEntityOr<{
    fns: PluginContextFn<RegistryComponentCommonEventFn<C>>[];
}>)
|
({
    event: RegistryComponentEvent.COMPONENT_CHANGED;
    component?: CT,
} & ToEntityOr<{
    fns: PluginContextFn<RegistryComponentCommonEventDataFn<C>>[];
}>);

function componentToEntity<
    C extends Component<C> = any,
>(
    this: PluginContext,
    fn: any,
    component: C,
    ..._args: any[]
): void {
    fn.call(this, component.entity);
}

function eventComponentToEntity<
    C extends Component<C> = any,
>(
    this: PluginContext,
    fn: any,
    _event: RegistryComponentEvent,
    component: C,
    ..._args: any[]
): void {
    fn.call(this, component.entity);
}

export function registerEventHandler<
    C extends Component<C> = any,
>(context: PluginContext, handler: EventHandler<C>): void {
    for (const fn of handler.fns) {
        if ('component' in handler && handler.component !== undefined) {
            if ('toEntity' in handler && handler.toEntity !== undefined) {
                if (handler.event
                    === RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE
                    || handler.event
                    === RegistryComponentEvent.COMPONENT_CHANGED) {
                    context.registry.componentEmitter(handler.component, true).on(
                        handler.event,
                        eventComponentToEntity.bind(context, fn),
                        context);
                } else {
                    context.registry.componentEmitter(handler.component, true).on(
                        handler.event,
                        componentToEntity.bind(context, fn),
                        context);
                }

            } else {
                context.registry.componentEmitter(handler.component, true).on(
                    handler.event, fn as any, context);
            }
        } else {
            context.registry.emitter.on(handler.event, fn as any, context);
        }
    }
}
