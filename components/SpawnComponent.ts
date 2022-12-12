import { Component, ComponentFlags } from '@/ecs/Component';

export interface SpawnComponentData {}

export class SpawnComponent extends Component
    implements SpawnComponentData {
    static TAG = 'SP';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
