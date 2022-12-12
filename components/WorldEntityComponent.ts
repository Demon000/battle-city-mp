import { Component, ComponentFlags } from '@/ecs/Component';

export interface WorldEntityComponentData {}

export class WorldEntityComponent extends Component
    implements WorldEntityComponentData {
    static TAG = 'WE';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
