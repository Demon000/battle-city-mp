import { Component, ComponentFlags } from '@/ecs/Component';

export interface IsMovingComponentData {}

export class IsMovingComponent extends Component
    implements IsMovingComponentData {
    static TAG = 'IM';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
