import { Component, ComponentFlags } from '@/ecs/Component';

export interface DirtyCollisionsUpdateComponentData {}

export class DirtyCollisionsUpdateComponent
    extends Component<DirtyCollisionsUpdateComponent>
    implements DirtyCollisionsUpdateComponentData {
    static TAG = 'DCU';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
