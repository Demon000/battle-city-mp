import { Component, ComponentFlags } from '@/ecs/Component';

export interface DestroyedComponentData {}

export class DestroyedComponent
    extends Component<DestroyedComponent>
    implements DestroyedComponentData {
    static TAG = 'D';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
