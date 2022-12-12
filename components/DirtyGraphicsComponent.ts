import { Component, ComponentFlags } from '@/ecs/Component';

export interface DirtyGraphicsComponentData {}

export class DirtyGraphicsComponent extends Component
    implements DirtyGraphicsComponentData {
    static TAG = 'DG';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
