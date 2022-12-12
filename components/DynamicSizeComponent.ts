import { Component, ComponentFlags } from '@/ecs/Component';

export interface DynamicSizeComponentData {}

export class DynamicSizeComponent extends Component
    implements DynamicSizeComponentData {
    static TAG = 'DS';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
