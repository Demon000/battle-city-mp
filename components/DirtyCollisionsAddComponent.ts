import { Component, ComponentFlags } from '@/ecs/Component';

export interface DirtyCollisionsAddComponentData {}

export class DirtyCollisionsAddComponent
    extends Component<DirtyCollisionsAddComponent>
    implements DirtyCollisionsAddComponentData {
    static TAG = 'DCA';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
