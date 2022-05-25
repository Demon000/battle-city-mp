import { Component, ComponentFlags } from '@/ecs/Component';

export interface DirtyCollisionsRemoveComponentData {}

export class DirtyCollisionsRemoveComponent
    extends Component<DirtyCollisionsRemoveComponent>
    implements DirtyCollisionsRemoveComponentData {
    static TAG = 'DCR';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
